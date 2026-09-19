# Architecture Decision Record

Each entry: the decision, the recommended default, acceptable alternatives, explicit anti-patterns, and the trigger that would make us revisit it.

## Format for new entries

```markdown
## ADR-00X: <title>
**Status:** Accepted | Superseded by ADR-00Y | Under review
**Default:** ...
**Acceptable alternative:** ... (when)
**Anti-pattern:** ... (why it's a trap)
**Reconsider when:** ...
```

Add new ADRs by appending — never edit history out of an old one; mark it Superseded and link forward instead.

---

## ADR-001: Netlify as the default hosting platform

**Status:** Accepted
**Default:** Netlify for hosting, SSR, serverless functions, deploy previews.
**Acceptable alternative:** Vercel, specifically for Next.js-heavy apps where first-party framework integration matters more than the existing prior-art config.
**Anti-pattern:** Running both, or switching mid-project without a concrete reason — the config (`netlify.toml` vs `vercel.json`) and function runtime model differ enough that "just try both" wastes real time.
**Reconsider when:** Function cold-start latency becomes user-visible, or you need long-running background workers (Netlify Functions have execution time limits — background functions extend but don't eliminate this).

## ADR-002: Supabase as the default data/auth platform

**Status:** Accepted
**Default:** Supabase for Postgres, Auth, Storage. RLS enabled on every table from the migration that creates it.
**Acceptable alternative:** Self-managed Postgres (Neon, RDS, etc.) if you need direct database access patterns Supabase doesn't expose, or already have auth infra you're required to keep (e.g. enterprise SSO mandated by a specific customer contract).
**Anti-pattern:** Using Supabase's Postgres but rolling your own auth, or using Supabase Auth but doing tenant isolation in application code instead of RLS. Both directions throw away the reason to use Supabase in the first place.
**Reconsider when:** Sustained connection-pool exhaustion, need for read replicas / cross-region reads, or compute tier costs exceed a dedicated Postgres instance for your workload.

## ADR-003: Stripe as the default billing platform

**Status:** Accepted
**Default:** Stripe Checkout + Billing Portal + webhooks, in test mode until Early Production.
**Acceptable alternative:** Paddle or LemonSqueezy when you are a solo founder selling internationally and don't want to own sales-tax/VAT registration — they act as merchant of record. This is a legitimate default swap, not a downgrade.
**Anti-pattern:** Building a custom subscription-state machine instead of trusting Stripe's subscription object as the source of truth; storing card data yourself (Checkout is hosted specifically so you never have to).
**Reconsider when:** Usage-based/metered billing complexity outgrows Stripe's native metering (consider Orb/Metronome in front of Stripe), or tax-registration overhead in many jurisdictions becomes the actual bottleneck (move to Paddle/LemonSqueezy).

## ADR-004: GitHub Actions as the default CI/CD platform

**Status:** Accepted
**Default:** GitHub Actions running typecheck + build + a grep-based secret scan on every PR, Dependabot for dependency updates.
**Acceptable alternative:** None recommended at MVP/early-production scale — the cost of a second CI system isn't justified.
**Anti-pattern:** Shipping a new repo with zero CI (the actual state of 11 of the 12 prior repos reviewed). The secret-scan job alone would have caught two real incidents in prior work.
**Reconsider when:** Build minutes cost or duration becomes a real bottleneck, or you need self-hosted/GPU runners.

## ADR-005: Three environments, mapped to separate Supabase projects and Stripe modes

**Status:** Accepted
**Default:** production / staging / preview, each Netlify deploy context pointing at the appropriate Supabase project and Stripe mode (see [environments.md](environments.md)).
**Acceptable alternative:** For a true single-developer, pre-revenue prototype, a single Supabase project with test-mode Stripe throughout Day 0 is acceptable — but split before real user data exists.
**Anti-pattern:** One Supabase project and one Stripe mode shared across production and preview deploys. This was the actual state of the most mature prior project (`standardcraft`) and is the single highest-leverage fix this playbook makes.
**Reconsider when:** Never — this doesn't get more complex with scale, it gets enforced more strictly (e.g. adding a fourth environment for load testing).

## ADR-006: RLS-first data access, not application-layer filtering

**Status:** Accepted
**Default:** Every table gets RLS enabled in the same migration that creates it. One policy per operation (`SELECT`/`INSERT`/`UPDATE`/`DELETE`), not blanket `FOR ALL`. Role checks via a `SECURITY DEFINER` helper function, not duplicated subqueries.
**Acceptable alternative:** None for anything touching user data. Service-role bypass is acceptable only inside Netlify Functions, never in client-reachable code.
**Anti-pattern:** Disabling RLS "temporarily" during development and forgetting to re-enable it; putting the service role key in any client-shipped bundle.
**Reconsider when:** Never — this is a floor, not a scaling concern.

## ADR-007: Idempotent, signature-verified Stripe webhooks as the source of truth for entitlements

**Status:** Accepted
**Default:** Webhook handler verifies `stripe-signature`, treats Stripe's event as the source of truth (not the client-side redirect after Checkout), and keys writes on a deterministic identifier (session ID, invoice period) so redelivery can't double-grant.
**Acceptable alternative:** None — this is a correctness requirement, not a style choice.
**Anti-pattern:** Granting access on the client-side "success" redirect alone (trivially spoofable — a user can navigate to the success URL without paying).
**Reconsider when:** Never.

## ADR-008: Sentry for error tracking from Day 0 of MVP

**Status:** Accepted
**Default:** Sentry wired in before first real user, both client and Netlify Functions.
**Acceptable alternative:** None strongly preferred — any error tracker beats none. Sentry chosen for the free tier and the fact it was the most conspicuous *missing* tool across every prior project reviewed.
**Anti-pattern:** Relying on users to report bugs, or on manually checking Netlify function logs.
**Reconsider when:** Volume/cost outgrows the free tier — evaluate self-hosted GlitchTip or a paid tier at that point, don't remove error tracking to save cost.
