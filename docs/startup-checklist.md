# Startup Checklist (Day 0 Overview)

This is the one-paragraph version. For the actual step-by-step checklist with commands, use [templates/launch-checklist.md](../templates/launch-checklist.md) — this page just explains the ordering logic.

## Why order matters

Accounts and services have dependencies — creating them out of order means redoing steps:

1. **GitHub repo first** (from this template) — everything else references it.
2. **Netlify site second** — links to the GitHub repo for deploy triggers; needs the repo to exist first.
3. **Supabase projects third** (create both `-staging` and `-prod` together) — Netlify env vars will reference their URLs/keys, so having both project refs up front avoids reconfiguring env vars twice.
4. **Stripe fourth** (test mode only at this stage) — webhook endpoint URL depends on the Netlify site existing (step 2), and metadata conventions depend on the Supabase user ID shape (step 3).
5. **Sentry, Plausible, Resend last** — genuinely independent of the others, add whenever convenient before launch.

Full command-by-command sequence: [templates/launch-checklist.md](../templates/launch-checklist.md).
