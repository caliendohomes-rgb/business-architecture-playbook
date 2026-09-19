# Production Readiness Checklist

Context and rationale in [docs/production-readiness.md](../docs/production-readiness.md).

## MVP done

- [ ] Sign up, sign in, sign out, session refresh all work end to end
- [ ] Every table has RLS enabled
- [ ] `main` deploys automatically on merge; every PR gets a preview
- [ ] CI blocks merge on failed build/typecheck/secret-scan
- [ ] A new developer could clone the repo, copy `.env.example` to `.env`, fill it in, and run locally without asking you anything

## Early production ready

- [ ] Stripe is live-mode; webhook signature verification confirmed against the real production endpoint
- [ ] Sentry capturing real errors, client + functions
- [ ] Uptime monitoring active on the production URL
- [ ] Environments verified isolated: `netlify env:list --context production` vs `--context deploy-preview` show different Supabase URLs
- [ ] A database backup has been restored successfully at least once
- [ ] Custom domain live, TLS valid, DNS correct (including MX records if email lives on the same domain)
- [ ] 2FA on every vendor account (GitHub, Netlify, Supabase, Stripe)
- [ ] A second human has admin access to each vendor account, or the bus-factor risk is explicitly accepted and documented
- [ ] Billing alerts set on Netlify and Supabase
- [ ] Full [security-checklist.md](security-checklist.md) passed

## Explicitly not required yet (don't build these prematurely)

- [ ] ~~Multi-region deployment~~
- [ ] ~~Kubernetes / container orchestration~~
- [ ] ~~Message queue / background job system~~ (scheduled functions / `pg_cron` are enough)
- [ ] ~~SOC 2 or formal compliance certification~~ (lightweight policy skeleton is enough until a customer contractually requires more)
- [ ] ~~Custom auth, custom rate limiter, custom logging pipeline~~
