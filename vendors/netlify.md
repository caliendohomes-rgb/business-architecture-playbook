# Netlify

## Setup order

1. Create the GitHub repo first (Netlify links to it).
2. `netlify init` or link via dashboard, connecting the repo.
3. Set `NODE_VERSION` and build command/publish dir in `netlify.toml` (checked into git — see [templates/config/netlify.toml](../templates/config/netlify.toml)), not only in the dashboard.
4. Set environment variables per context — see [environments.md](../docs/environments.md) for why this matters more than anything else in this file.
5. Add a custom domain once you have one (see [deployment.md](../docs/deployment.md#custom-domains--dns)).

## `netlify.toml` — what a good one contains

Based on the most mature prior implementation:

- **Pinned Node version** — an unpinned version was the direct cause of a real prior production build break when Netlify's platform default shifted under an existing project.
- **Explicit `[build]` command and `publish` directory** — don't rely on framework auto-detection.
- **Security headers block**: `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
- **A real Content-Security-Policy**, scoped to exactly the third-party origins you call (Supabase, Stripe, Plausible, Sentry, Resend) — not `unsafe-inline`/`*` as a shortcut. Update it when you add a vendor, don't let it drift.
- **`Cache-Control: no-store` on `/api/*`** (or wherever your functions live) — API responses should never be cached by the CDN or the browser by default.
- **Redirects consolidated here**, not split across `_redirects` and dashboard-only rules — a diff-reviewable single source of truth.

Full template: [templates/config/netlify.toml](../templates/config/netlify.toml).

## Functions

- Server-only logic lives in Netlify Functions: Stripe webhook handling, any call requiring the Supabase service role key, any third-party API call requiring a secret.
- Keep functions small and single-purpose (one file per concern — `checkout.ts`, `webhook.ts`, not one giant `api.ts` handling everything via a switch statement).
- Watch execution time limits for anything long-running; a function approaching the limit is a signal to move that work to a scheduled/background function or reconsider the architecture (see [reference-architecture.md](../architecture/reference-architecture.md#growth-triggers--when-to-reconsider-this-architecture)), not to optimize around the limit.

## Environment variables — the part prior projects got wrong

Every previous project set environment variables once, globally, with the same value across production, branch deploys, and previews. That means a PR preview could point at the real production Supabase project and real Stripe live keys.

Use context-scoped variables instead — full walkthrough in [environments.md](../docs/environments.md). The short version:

```bash
netlify env:set SUPABASE_URL "<prod-url>" --context production
netlify env:set SUPABASE_URL "<staging-url>" --context branch-deploy --context deploy-preview
```

Tag anything sensitive with `--secret` so Netlify excludes it from build logs and flags it if it ends up in client-side output.

## Deploy previews as a review tool

Every PR gets a live preview URL automatically (posted as a PR comment) — use it as part of code review, not just CI status. A preview pointed at the isolated staging backend (see [environments.md](../docs/environments.md)) is safe to click around in freely, which is the whole point of isolating it.

## When Netlify stops being the right choice

See [architecture-decisions.md — ADR-001](../docs/architecture-decisions.md#adr-001-netlify-as-the-default-hosting-platform). Function cold-start latency becoming user-visible, or needing long-running background workers beyond what background functions support, are the concrete triggers — not "Vercel looks nice."
