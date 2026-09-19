# Monitoring & Alerting

None of the prior projects reviewed had error tracking, uptime monitoring, or alerting of any kind. This is the gap most likely to bite you the first time something breaks silently in production while you're not looking.

## MVP-stage minimum

- **Sentry** (client + Netlify Functions) — every unhandled exception reaches you without a user having to report it. Wire this in before launch, not after the first incident.
- **Netlify deploy notifications** — Slack/email on failed builds/deploys (built into Netlify, just turn it on).
- **Stripe email alerts** — enabled by default for failed payments/disputes; don't turn these off.

## Early-production additions

- **Uptime monitoring** on the production URL (UptimeRobot, Better Uptime, or similar free/cheap tier) — pings every few minutes, alerts on downtime. This catches the case where the app is up but returning errors on every request, which Netlify's own status won't tell you.
- **Sentry alert rules** — don't just collect errors, get paged (or at least emailed) on a spike, not only browse the dashboard occasionally.
- **Stripe webhook delivery monitoring** — Stripe's dashboard shows failed webhook deliveries; check this weekly at minimum, or set up an alert if delivery failure rate crosses a threshold.
- **Supabase dashboard checks** — database size, connection count, and API request volume against your plan's limits. Supabase will email as you approach plan limits; don't ignore those emails.

## What "good" looks like

You should be able to answer, without SSH-ing into anything: is the site up, is checkout working, are there new errors since the last deploy, and is the database anywhere near a resource limit. If any of those requires manually checking multiple dashboards from memory, add a lightweight alert instead of relying on remembering to check.

## Deliberately deferred (growth trigger, not MVP)

- Centralized structured logging (e.g. Datadog, Better Stack) — Netlify function logs + Sentry breadcrumbs are enough until log volume or cross-service correlation needs actually demand more.
- APM/distributed tracing — irrelevant until there's more than one service to trace between.
- On-call rotation/paging (PagerDuty, Opsgenie) — relevant once more than one person needs to be woken up; a phone notification from Sentry/UptimeRobot is enough for a solo founder.
