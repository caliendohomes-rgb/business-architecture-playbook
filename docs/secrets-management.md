# Secrets Management

## Where secrets live

| Secret | Lives in | Never in |
|---|---|---|
| Supabase service role key | Netlify env vars (secret-tagged, per context) | Client bundle, git, Slack/email, `.env` committed to git |
| Supabase anon key | Netlify env vars + committed `.env.example` placeholder | N/A — this one is meant to be public, but still keep it in env vars, not hardcoded, so it can rotate |
| Stripe secret key | Netlify env vars (secret-tagged, per context) + GitHub Actions secret if CI needs it | Client bundle, git |
| Stripe webhook signing secret | Netlify env vars (secret-tagged) | Client bundle, git |
| Stripe publishable key | Netlify env vars + `.env.example` placeholder | N/A — meant to be public |
| Resend/SMTP credentials | Netlify env vars (secret-tagged) | git, client bundle |
| Sentry DSN | Netlify env vars (public-ish, but still env var not hardcoded) | N/A |

## Naming convention

`<VENDOR>_<PURPOSE>[_<SCOPE>]`, uppercase snake_case:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_STARTER
STRIPE_PRICE_ID_PRO
RESEND_API_KEY
SENTRY_DSN
PLAUSIBLE_DOMAIN
```

Client-exposed variables get your framework's public-variable prefix on top of this (e.g. `PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) — the prefix makes it visually obvious at the call site that a value ships to the browser. Never add that prefix to a secret key out of laziness.

## The one rule that matters most

**A secret's blast radius is defined by the narrowest set of systems that actually need it — grant it there and nowhere else.** The service role key does not need to exist in GitHub Actions unless CI actually runs migrations or admin scripts against a real project. If CI doesn't need it, don't add it as an Actions secret just because it's convenient to have everywhere.

## Rotation

1. Generate the new key/secret in the vendor dashboard (Supabase/Stripe both support rotating without downtime — old and new can briefly coexist).
2. Update the Netlify env var for the affected context(s).
3. Trigger a redeploy (env var changes don't apply to already-built assets).
4. Update the corresponding GitHub Actions secret if it's duplicated there.
5. Revoke the old key once the new one is confirmed live.
6. Note the rotation date somewhere durable (a `SECURITY.md` log or your incident tracker) if the rotation was prompted by a suspected leak.

## Preventing accidental commits

Two prior projects got this wrong in different ways: one had no `.env` entry in `.gitignore` at all; one committed a runtime SQLite database with personal data to a **public** repo. Both are preventable with the same two controls:

1. **`.gitignore` from Day 0**, before the first commit — see [templates/config/](../templates/config/) for the baseline. At minimum: `.env`, `.env.*` (except `.env.example`), `*.db`, `*.sqlite`, `/logs/`, `.netlify/`.
2. **CI secret scan on every PR** — a cheap grep-based job (see [templates/config/github-workflows-ci.yml](../templates/config/github-workflows-ci.yml)) that fails the build on patterns like `sk_live_`, `sk_test_`, `whsec_`, `-----BEGIN PRIVATE KEY-----`. This is not a substitute for `.gitignore` — it's a backstop for the time `.gitignore` gets it wrong.

If a secret does get committed: rotating it is mandatory, not optional — `git filter-repo`/BFG history rewriting does not un-leak a key that was ever pushed to a remote. Treat it as compromised the moment `git push` succeeds.

## `.env.example` is documentation, not boilerplate

Every variable gets a comment: where it comes from, and which scope it needs. See [templates/env.example](../templates/env.example). Keep it in sync with reality — a stale `.env.example` is worse than none, because it actively misleads the next setup.
