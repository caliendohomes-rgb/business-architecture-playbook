# Launch Checklist

The full Day 0 → MVP sequence, in dependency order. See [docs/startup-checklist.md](../docs/startup-checklist.md) for why this order.

## 1. GitHub

- [ ] `gh repo create <name> --template caliendohomes-rgb/business-architecture-playbook --private --clone`
- [ ] Work through [repository-checklist.md](repository-checklist.md) in full

## 2. Netlify

- [ ] Create site, link to the GitHub repo (dashboard, or `netlify init`)
- [ ] Copy [templates/config/netlify.toml](config/netlify.toml) into the repo root, adjust build command/publish dir for your framework
- [ ] Confirm the site builds and deploys once (even with placeholder content) before adding env vars

## 3. Supabase — create both projects together

- [ ] `<app>-staging` project created
- [ ] `<app>-prod` project created
- [ ] Note both project refs and API keys somewhere durable (password manager)
- [ ] Set Netlify env vars per context per [environments.md](../docs/environments.md):
  - [ ] `PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` → `production` context = prod project
  - [ ] `PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` → `branch-deploy` + `deploy-preview` contexts = staging project
- [ ] First migration applied to both projects (schema + RLS from the start — see [vendors/supabase.md](../vendors/supabase.md))
- [ ] Auth provider(s) configured (magic link / OAuth) in both projects — settings don't sync automatically between projects, configure each one

## 4. Stripe — test mode only at this stage

- [ ] Products/prices created in test mode
- [ ] `STRIPE_PRICE_ID_*` env vars set (staging/preview contexts, test-mode price IDs)
- [ ] Test-mode webhook endpoint registered, pointed at the Netlify staging/preview URL pattern
- [ ] `STRIPE_WEBHOOK_SECRET` (test mode) set in `branch-deploy` + `deploy-preview` contexts
- [ ] Checkout flow tested end-to-end with a Stripe test card
- [ ] Webhook delivery confirmed in the Stripe dashboard's event log

## 5. Sentry

- [ ] Project created, DSN added to `PUBLIC_SENTRY_DSN` (all contexts — Sentry environments distinguish prod/staging via a separate `environment` tag, not a different DSN)
- [ ] Client-side error capture verified (throw a test error, confirm it appears in Sentry)
- [ ] Netlify Functions error capture verified

## 6. Plausible (or chosen analytics)

- [ ] Site added, `PUBLIC_PLAUSIBLE_DOMAIN` set
- [ ] Script confirmed loading (check Plausible dashboard for the first pageview)

## 7. Resend (or chosen email provider)

- [ ] API key created, `RESEND_API_KEY` set (secret-tagged)
- [ ] Sending domain verified (SPF/DKIM records added at your DNS provider)
- [ ] One test email sent and received

## Ready for MVP — see [templates/production-readiness-checklist.md](production-readiness-checklist.md) before opening this up to real users

## Ready to go live with Stripe — see [vendors/stripe.md#test--production-promotion-checklist](../vendors/stripe.md#test--production-promotion-checklist)
