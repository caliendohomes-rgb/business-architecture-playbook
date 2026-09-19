# Production Readiness (Overview)

This page explains what "ready" means at each stage. The actual checklist to run through is [templates/production-readiness-checklist.md](../templates/production-readiness-checklist.md).

## MVP-done means

- Auth works end to end (sign up, sign in, sign out, password/session refresh).
- Core data model exists with RLS enabled on every table.
- The app deploys automatically on merge to `main`, previews automatically on every PR.
- CI blocks merge on a failed build, typecheck, or secret-scan hit.
- `.env.example` is accurate and a new developer could clone + configure + run locally from it alone.

## Early-production-ready means

- Every item in MVP-done, plus:
- Stripe is live-mode, webhook signature verification confirmed against the real production endpoint (not just tested in test mode).
- Sentry is capturing real errors from both client and functions.
- Environments are actually isolated (see [environments.md](environments.md)) — verified, not assumed.
- A backup has been restored successfully at least once (see [backup-recovery.md](backup-recovery.md)).
- Custom domain is live with valid TLS and correct DNS (including MX records if email lives on the same domain).
- 2FA is on for every vendor account, and a second human has admin access or the bus-factor risk has been explicitly accepted.

## Not required at either stage (common over-engineering to avoid)

- Multi-region deployment
- Kubernetes or any container orchestration
- A message queue / background job system beyond scheduled functions or `pg_cron`
- SOC 2 / formal compliance certification (the lightweight policy skeleton in [security.md](security.md#compliance-readiness-early-production-not-day-0) is enough until a customer contractually requires the real thing)
- Custom auth system, custom rate-limiter infra, custom logging pipeline — all covered adequately by Supabase, Netlify's built-ins, and Sentry respectively
