# Architecture Overview

One-page summary. For depth, see [architecture/reference-architecture.md](../architecture/reference-architecture.md).

## The shape of it

A single web application, deployed via Netlify, backed by Supabase for data/auth, billed through Stripe, observed by Sentry and Plausible. Three environments (production/staging/preview), each with its own Supabase project and Stripe mode. No backend server to operate — "backend" is Netlify Functions plus Supabase's managed Postgres.

## Who owns what

| Responsibility | Owner |
|---|---|
| Identity, sessions | Supabase Auth |
| Data storage, tenant isolation | Supabase Postgres + RLS |
| File/blob storage | Supabase Storage |
| Static hosting, SSR, CDN | Netlify |
| Server-only logic (webhooks, admin actions, third-party API calls with secrets) | Netlify Functions |
| Payments, subscriptions, invoicing | Stripe |
| CI, code review gate, dependency updates | GitHub Actions + Dependabot |
| Error visibility | Sentry |
| Traffic/conversion visibility | Plausible |
| Transactional email | Resend (or SMTP fallback) |

## What is explicitly out of scope by default

- No dedicated backend server/container to operate (Netlify Functions cover it until a growth trigger says otherwise).
- No message queue / background job system (cron-style Netlify scheduled functions or Supabase's `pg_cron` cover early needs).
- No service mesh, no multi-region, no Kubernetes.
- No custom auth system — Supabase Auth, full stop, until there's a specific unmet requirement.

## Reading order for a new team member

1. [reference-architecture.md](../architecture/reference-architecture.md) — the stack and why
2. [data-flow.md](../architecture/data-flow.md) — how a request actually moves
3. [environments.md](environments.md) — how prod/staging/preview stay isolated
4. [security.md](security.md) — the trust boundaries that must never be violated
5. The relevant `vendors/*.md` for whatever you're about to touch
