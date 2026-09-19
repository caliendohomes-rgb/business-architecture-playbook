# Cost Management

## Day 0 / MVP — should cost close to $0

| Vendor | Free tier covers |
|---|---|
| GitHub | Unlimited private repos, 2,000 Actions minutes/month |
| Netlify | 100GB bandwidth, 300 build minutes/month — plenty for MVP traffic |
| Supabase | 2 free projects (enough for prod + staging), 500MB DB, 1GB storage, 50k monthly active users on Auth |
| Stripe | No monthly fee ever — pay per-transaction only, so test mode costs nothing and live mode only costs money when you're making money |
| Plausible | Free self-hosted, or ~$9/mo hosted for low traffic |
| Resend | 3,000 emails/month free |
| Sentry | 5k errors/month free |

A new business should be able to run production for months on free tiers alone, aside from the domain name (~$10-15/year) and possibly hosted Plausible.

## Early production — first real costs

- **Supabase production project → paid plan** (~$25/mo) once you need real backup retention or exceed free-tier limits — see [backup-recovery.md](backup-recovery.md). Keep staging on the free tier.
- **Netlify** — usually stays free well past MVP unless bandwidth or build minutes spike; upgrade reactively, not preemptively.
- **Stripe fees** (2.9% + $0.30 typical US card rate) — factor into pricing, not a separate line item to "manage."

## Cost control practices

- **One Supabase org, one Netlify team** across all your ventures if you're running several — some plans have per-seat or per-project pricing that's cheaper consolidated, but keep production data fully isolated per project regardless (see [environments.md](environments.md)) — consolidating billing is not the same as consolidating data.
- **Set billing alerts** on every vendor that supports them (Stripe doesn't need one since it's transaction-based; Supabase and Netlify both support usage alerts — turn them on at setup, not after a surprise bill).
- **Review Dependabot/CI minutes usage** if it starts adding up — grouping minor/patch updates (see [templates/config/dependabot.yml](../templates/config/dependabot.yml)) keeps PR volume, and therefore CI minutes, down.
- **Don't pre-pay for scale.** Every "reconsider when" trigger in [architecture-decisions.md](architecture-decisions.md) exists specifically so you upgrade a component when the evidence says to, not on a hunch.

## Vendor lock-in awareness

None of the defaults here are hard to leave:

- **Supabase** — it's real Postgres; `pg_dump` gets your data and schema out. Auth is the harder migration (users, sessions) but Supabase supports exporting auth users.
- **Netlify** — static builds and standard serverless function signatures port to most competitors with config changes, not a rewrite.
- **Stripe** — customer/subscription data can be exported; the actual lock-in is integration code, which is why this playbook keeps webhook/checkout logic in a small number of well-isolated files (see [vendors/stripe.md](../vendors/stripe.md)).

The one non-trivial lock-in is **RLS policies**, which are Postgres-specific SQL — but that's lock-in to Postgres-the-standard, not to Supabase-the-vendor, so it's a low-risk form of lock-in.
