# Environments

**This is the single highest-priority fix relative to prior implementations.** Every previous project used the same Supabase project and the same Stripe mode across production and preview/staging deploys. A buggy PR preview could read or write real production data, or trigger a real charge. Fix this before writing feature code, not after.

## The three environments

| Environment | Netlify deploy context | Branch | Supabase project | Stripe mode | Who sees it |
|---|---|---|---|---|---|
| Production | `production` | `main` | `<app>-prod` | Live | Real users |
| Staging | `branch-deploy` | `staging` | `<app>-staging` | Test | You, before promoting to prod |
| Preview | `deploy-preview` | any PR branch | `<app>-staging` (shared with staging) | Test | Reviewers on that PR |

Preview shares the staging Supabase project rather than getting a fourth project — that's an intentional simplification. If two PRs need truly isolated data at the same time, that's a growth trigger for ephemeral per-PR databases (e.g. Supabase branching, when it fits your plan), not a Day-0 default.

## Netlify context-scoped environment variables

Netlify lets you set different values for the *same* variable name per deploy context. Use this — do not rely on a single global value and a mental note about which one is "real."

```bash
# Production value
netlify env:set SUPABASE_URL "https://prod-ref.supabase.co" --context production
netlify env:set SUPABASE_SERVICE_ROLE_KEY "<prod-service-role-key>" --context production --secret
netlify env:set STRIPE_SECRET_KEY "sk_live_..." --context production --secret

# Staging + preview share the staging project
netlify env:set SUPABASE_URL "https://staging-ref.supabase.co" --context branch-deploy --context deploy-preview
netlify env:set SUPABASE_SERVICE_ROLE_KEY "<staging-service-role-key>" --context branch-deploy --context deploy-preview --secret
netlify env:set STRIPE_SECRET_KEY "sk_test_..." --context branch-deploy --context deploy-preview --secret
```

`--secret` marks a variable so it's excluded from the build log and from client-side bundling by default (Netlify's "secrets scanning" will fail the build if a value tagged secret leaks into client output — leave this on).

Verify with:

```bash
netlify env:list --context production
netlify env:list --context deploy-preview
```

Two different values should print for `SUPABASE_URL`. If they're the same, environments are not actually isolated — stop and fix before continuing.

## Database migrations across environments

Migrations always apply to staging first, get verified there, then apply to production. See [Supabase migration workflow](../vendors/supabase.md#migration-workflow) for the exact commands. Never hand-run a migration directly against production that hasn't run against staging first — not even a "trivial" one.

## Stripe test vs. live mode

Stripe test and live mode are entirely separate data stores (products, prices, customers, webhook endpoints all need to exist in both). Create products/prices in both modes with the Stripe CLI or dashboard, and keep price IDs in environment variables (never hardcoded) so the same code path works in both modes — see [vendors/stripe.md](../vendors/stripe.md).

## Local development

Local dev talks to the **staging** Supabase project and **test-mode** Stripe, never production, never a separate fourth project. Use `supabase start` (local Postgres via Docker) only if you specifically need offline development or want to test destructive migrations without touching shared staging — otherwise point local env vars at staging directly to avoid local/staging drift.
