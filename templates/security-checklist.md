# Security Checklist

Run before launch, and periodically after. Full context in [docs/security.md](../docs/security.md).

## Access control

- [ ] RLS enabled on every table, in the migration that created it
- [ ] One policy per operation (select/insert/update/delete), not blanket `for all`
- [ ] Service role key referenced only in Netlify Functions code, never in anything that could reach a client bundle
- [ ] Any `security definer` function has `set search_path = public` and explicit narrow `grant`/`revoke`

## Secrets

- [ ] `.gitignore` covers `.env*` (except `.env.example`), `*.db`, `*.sqlite`, `/logs/`, `.netlify/`
- [ ] No secret has ever been committed (check `git log --all --full-history -- .env` and similar if in doubt)
- [ ] CI secret-scan job active and verified working (test with a deliberately fake secret once)
- [ ] Netlify env vars are context-scoped, not global (see [environments.md](../docs/environments.md))
- [ ] Every secret tagged `--secret` in Netlify

## Webhooks & payments

- [ ] Stripe webhook handler verifies `stripe-signature` before trusting the payload
- [ ] Webhook writes are idempotent (keyed on a deterministic identifier, safe under redelivery)
- [ ] Failed critical writes return 5xx (so Stripe retries), not a swallowed error + 200
- [ ] Client-side Checkout success redirect never grants access by itself

## Infrastructure

- [ ] 2FA enabled on GitHub, Netlify, Supabase, Stripe
- [ ] A second human has admin access, or the bus-factor risk is explicitly accepted
- [ ] Security headers + CSP set in `netlify.toml`, scoped to actual vendors used
- [ ] `Cache-Control: no-store` on API routes

## Data

- [ ] No real customer/user data or real vendor account identifiers in documentation, examples, or public-facing docs
- [ ] Data retention policy exists, even a one-paragraph version (see [docs/security.md#compliance-readiness-early-production-not-day-0](../docs/security.md#compliance-readiness-early-production-not-day-0))
- [ ] Incident response steps written down before they're needed (same section)

## Known anti-patterns to specifically check for

- [ ] No runtime database/log files committed to the repo (check `git log` for `.db`, `.sqlite`, `logs/` — this happened in a prior public repo)
- [ ] No shared Supabase project / Stripe mode between production and preview/staging deploys
