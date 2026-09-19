// netlify/functions/webhook.ts — reference implementation. See vendors/stripe.md for rationale.
import Stripe from 'stripe'
import { supabaseAdmin } from '../../lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    // Log detail server-side only — never leak why verification failed to the caller.
    console.error('Webhook signature verification failed', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      // Add new cases as needed — always keyed on a deterministic identifier for idempotency.
    }
  } catch (err) {
    // Critical failure: return 5xx so Stripe retries instead of silently losing an entitlement.
    console.error('Webhook handler failed', err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(null, { status: 200 })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabaseUserId = session.metadata?.supabase_user_id
  if (!supabaseUserId) {
    console.error('checkout.session.completed missing supabase_user_id metadata', session.id)
    return
  }

  // Idempotency key: the session ID itself, for a one-time entitlement grant.
  // A unique constraint on (supabase_user_id, stripe_session_id) makes redelivery a no-op.
  const { error } = await supabaseAdmin
    .from('entitlements')
    .upsert(
      { user_id: supabaseUserId, stripe_session_id: session.id, granted_at: new Date().toISOString() },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    )
  if (error) throw error

  // Non-critical side effect — wrapped so a failure here can't cause a duplicate grant
  // if the handler is retried.
  try {
    await sendWelcomeEmail(supabaseUserId)
  } catch (err) {
    console.error('Non-critical: welcome email failed', err)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
  if (!subscriptionId) return

  // periodKey dedupes recurring credit grants across webhook redelivery for the same billing period.
  const periodKey = `${subscriptionId}:${invoice.period_start}`

  const { error } = await supabaseAdmin.rpc('grant_subscription_credits', {
    p_subscription_id: subscriptionId,
    p_period_key: periodKey,
  })
  if (error) throw error
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabaseUserId = subscription.metadata?.supabase_user_id
  if (!supabaseUserId) return

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: supabaseUserId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  if (error) throw error
}

async function sendWelcomeEmail(userId: string) {
  // Implementation via Resend or your chosen provider — omitted here.
}
