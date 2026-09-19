// netlify/functions/checkout.ts — reference implementation. See vendors/stripe.md for rationale.
import Stripe from 'stripe'
import { supabaseServer } from '../../lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Server-side source of truth for what a client is allowed to purchase.
// Never trust a price ID sent from the client directly.
const PLANS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER!,
  pro: process.env.STRIPE_PRICE_ID_PRO!,
}

// Naive in-memory rate limiter — replace with a durable store (e.g. a Supabase table
// or Upstash) once running on more than one function instance.
const recentRequests = new Map<string, number[]>()
function isRateLimited(key: string, limit = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const timestamps = (recentRequests.get(key) ?? []).filter((t) => now - t < windowMs)
  timestamps.push(now)
  recentRequests.set(key, timestamps)
  return timestamps.length > limit
}

export default async (req: Request) => {
  const ip = req.headers.get('x-nf-client-connection-ip') ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response('Too many requests', { status: 429 })
  }

  const { plan } = await req.json()
  const priceId = PLANS[plan]
  if (!priceId) {
    return new Response('Invalid plan', { status: 400 })
  }

  // Requires an authenticated Supabase session — no anonymous checkout.
  const supabase = supabaseServer(/* cookies from req */ undefined as any)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Find-or-create the Stripe customer by email first — prevents duplicate
  // customer records on retry/double-click.
  const existing = await stripe.customers.list({ email: user.email!, limit: 1 })
  const customer =
    existing.data[0] ??
    (await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    }))

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    // Session-level metadata does NOT survive onto later subscription-lifecycle
    // webhook events on its own — also set it via subscription_data below.
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    success_url: `${process.env.PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_APP_URL}/billing`,
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
