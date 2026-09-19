# Other Services

Vendors observed across prior projects, plus defaults for categories that were consistently missing.

## Observed in prior projects

| Category | Vendor used | Notes |
|---|---|---|
| Transactional email | Authenticated SMTP via Google Workspace (Nodemailer) | Worked fine at near-zero volume; graceful no-op fallback when unconfigured (email step skipped, underlying record still saved) is a pattern worth keeping regardless of provider |
| Analytics | Plausible (planned, not yet wired in the repo that defined the event taxonomy) | Chosen specifically for no cookie-banner requirement; event taxonomy documented *before* implementation — do this step, it's cheap and prevents ad hoc event naming later |
| App-generation tooling | Lovable.dev | A different way to bootstrap an app (AI-assisted scaffold) than hand-coding; produces a working app but with a simpler Supabase client setup than the hand-built reference — treat Lovable-generated code as a starting point to harden against this playbook's patterns (especially RLS and env separation), not as production-ready as-is |
| Desktop packaging | Electron + electron-builder | Only relevant for local-only tools with no backend vendor; not part of the default web-app architecture |

## Gaps — used by nobody, but should be defaults going forward

These categories had zero representation across every prior project and are genuine gaps, not deliberate simplifications:

- **Error tracking** — see [monitoring.md](../docs/monitoring.md). Default: **Sentry**.
- **Uptime monitoring** — see [monitoring.md](../docs/monitoring.md). Default: **UptimeRobot** or **Better Uptime** (free/cheap tier).
- **DNS/domain provider** — no strong preference observed or required. Default: whatever registrar, with DNS delegated to Netlify for simplicity (see [deployment.md](../docs/deployment.md#custom-domains--dns)); Cloudflare if you specifically want DNS-level features (WAF, extra DNS records) independent of hosting.
- **Secrets management beyond Netlify/GitHub's built-ins** — not needed at MVP/early-production scale. A dedicated secrets manager (Doppler, 1Password Secrets Automation, AWS Secrets Manager) is a growth trigger once you have more than a couple of services needing the same secrets kept in sync, not a Day-0 requirement.

## Categories deliberately deferred (not gaps — genuine non-requirements at this stage)

- **CRM / marketing automation** — add when you have enough leads/customers that a spreadsheet or Stripe's own customer list stops being enough. Don't set up a CRM for zero customers.
- **Background jobs / queues** — Netlify scheduled functions or Supabase `pg_cron` cover early recurring-task needs; a real queue (SQS, BullMQ+Redis) is a growth trigger once job volume or retry semantics outgrow those.
- **Dedicated logging/observability platform** (Datadog, Better Stack) — Sentry + Netlify function logs are enough until cross-service correlation is actually needed.
- **AI/LLM provider integration** — none of the prior projects called an LLM API at runtime (despite "AI" appearing in project names — that was process automation, not an in-app integration). If a new venture's product genuinely is an LLM-backed feature, that's product-specific and outside this playbook's scope; default to Anthropic's API for anything agentic/tool-using, OpenAI as an acceptable alternative, and always keep the API key server-side only (same rule as every other secret in [secrets-management.md](../docs/secrets-management.md)).
- **Dedicated security tooling** (SAST/DAST scanners, WAF) — the CI secret-scan + Dependabot + RLS-first design cover the realistic threat model at this scale; add a WAF (e.g. Cloudflare) if you're specifically dealing with abuse/scraping traffic, not preemptively.
