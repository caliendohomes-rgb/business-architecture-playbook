# Stripe

The most production-grade pattern found across prior projects came from a single implementation — this doc is essentially that pattern generalized. See [templates/config/stripe-checkout-handler.ts](../templates/config/stripe-checkout-handler.ts) and [templates/config/stripe-webhook-handler.ts](../templates/config/stripe-webhook-handler.ts) for copy-paste-ready code.

## Products & pricing

- Create products/prices in the Stripe dashboard (or via API for scripted setup) in **both** test and live mode — they're entirely separate data stores.
- Store price IDs in environment variables (`STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, ...), never hardcoded in application code — the same code path then works unchanged across test/live mode and across environments.
- Keep a server-side map of plan → price ID as the single source of truth for what a client is allowed to purchase; never trust a price ID sent from the client.

## Checkout

- Require an authenticated Supabase session before creating a Checkout Session — no anonymous checkout.
- Validate the requested plan against the server-side price map (above) — don't pass through whatever the client sends.
- **Find-or-create the Stripe customer by searching for an existing one by email first** — prevents duplicate customer records on retry/double-click.
- Store `supabase_user_id` in Checkout Session metadata **and** propagate it to the resulting subscription's metadata — the session-level metadata alone doesn't survive onto later subscription-lifecycle webhook events, which is why both are needed.
- Rate-limit the checkout endpoint (e.g. 10 requests/10min/IP) before any Stripe API call — this is a real-money-adjacent endpoint, treat it like one.

## Webhooks — the part that must be exactly right

```ts
// netlify/functions/webhook.ts (illustrative — see templates/config/stripe-webhook-handler.ts for the full version)
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async (req: Request) => {
  const signature = req.headers.get('stripe-signature')!
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    // Log detail server-side only; never leak why verification failed to the caller
    console.error('Webhook signature verification failed', err)
    return new Response('Invalid signature', { status: 400 })
  }

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
  }

  return new Response(null, { status: 200 })
}
```

Invariants, in order of importance:

1. **Always verify the signature** via `constructEvent`. Reject unsigned/invalid payloads with a generic 400 — don't describe what failed.
2. **The webhook is the source of truth for entitlements — not the client-side Checkout success redirect.** A user can navigate to your "success" URL without paying; only a verified webhook event should grant access.
3. **Idempotency**: Stripe *will* redeliver events (network hiccups, slow handlers, timeouts). Key every state-changing write on a deterministic identifier — a `period_key` (e.g. `subscriptionId + currentPeriodStart`) for recurring credit grants, or the session ID for one-time entitlements — so a redelivered event is a no-op, not a duplicate grant. A dedicated ledger table with a unique constraint on that key, applied via an atomic RPC, is the pattern to copy.
4. **Non-critical side effects (e.g. sending a notification email) should be wrapped so they can't cause a duplicate grant if they fail and the handler retries** — separate the "grant the entitlement" transaction from "notify about it."
5. **Return a 5xx if the critical write fails.** Swallowing the error and returning 200 anyway means Stripe won't retry, and you silently lose an entitlement. Return 500 specifically so Stripe redelivers.

## Subscriptions & the Customer Portal

Use Stripe's Billing Portal for plan changes, payment method updates, and cancellations rather than building custom UI for any of it — it's a pre-built, PCI-compliant surface Stripe maintains. (No prior project had this wired up despite tracking a `billing_portal.created` event type — treat this as a known gap to close, not a pattern to repeat.)

## Test → production promotion checklist

- [ ] Products/prices created in live mode, price IDs updated in the production environment's env vars
- [ ] Production webhook endpoint registered in the Stripe dashboard (live mode), pointed at the real production URL
- [ ] `STRIPE_WEBHOOK_SECRET` for the *live* endpoint set in Netlify's `production` context — this is a different secret from the test-mode endpoint's, a common source of "webhooks work in staging but not prod" bugs
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are the live-mode (`sk_live_`/`pk_live_`) versions in the `production` context only — staging/preview stay on test-mode keys
- [ ] Send a real test transaction (e.g. your own card, refund immediately) through the live endpoint before announcing launch
- [ ] Confirm the CI secret scan pattern (`sk_live_`, `whsec_`) is active — see [templates/config/github-workflows-ci.yml](../templates/config/github-workflows-ci.yml)

## Local development & testing

Use the Stripe CLI to forward webhooks to a local dev server against **test mode only**:

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/webhook
stripe trigger checkout.session.completed
```

Never point local development at live-mode keys.
