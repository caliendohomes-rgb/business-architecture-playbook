# Data Flow

Two flows matter most for security review: authentication, and payments. Both are diagrammed here; raw Mermaid sources are also in [diagrams/](diagrams/) for reuse in slides/docs elsewhere.

## Authentication & data access flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Netlify (Static/SSR)
    participant SA as Supabase Auth
    participant DB as Supabase Postgres (RLS)

    U->>N: Request page
    N-->>U: HTML + anon key (public, safe to ship)
    U->>SA: Sign in (email/OTP or OAuth)
    SA-->>U: Session JWT (short-lived) + refresh token (httpOnly cookie)
    U->>DB: Query with JWT (via supabase-js, anon key)
    DB->>DB: RLS policy evaluates auth.uid() from JWT
    DB-->>U: Rows the policy allows — nothing more
    Note over U,DB: Browser NEVER receives the service role key.<br/>RLS is the enforcement point, not application code.
```

**Key invariant:** the same query, run by two different authenticated users, returns different rows because of RLS — not because the client filtered by `user_id` and could theoretically be tricked not to.

## Stripe payment & webhook flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant Fn as Netlify Function
    participant S as Stripe
    participant DB as Supabase Postgres

    U->>Fn: POST /api/checkout (authenticated session)
    Fn->>Fn: Rate limit; validate requested plan against server-side price map
    Fn->>S: Find-or-create customer (search by email first — avoid dupes)
    Fn->>S: Create Checkout Session (metadata: supabase_user_id)
    S-->>Fn: Session URL
    Fn-->>U: Redirect to Stripe-hosted Checkout
    U->>S: Completes payment on Stripe's page (card data never touches your app)
    S-->>Fn: Webhook: checkout.session.completed (signed)
    Fn->>Fn: Verify signature via stripe.webhooks.constructEvent — reject unsigned/invalid with generic 400
    Fn->>DB: Write subscription/entitlement (idempotent: keyed on session/period, safe under Stripe retries)
    DB-->>Fn: OK
    Fn-->>S: 200 (only after the write commits — return 500 on failure so Stripe retries)
```

**Key invariants:**
- Card data never touches your servers (Stripe Checkout is hosted).
- The webhook handler is idempotent — Stripe *will* redeliver events, and duplicate delivery must never double-grant.
- A failed database write after a verified webhook must return a 5xx, not swallow the error — you want Stripe to retry rather than silently drop an entitlement.

## Dev → staging → production promotion path

```mermaid
flowchart LR
    subgraph Local["Local dev"]
        Code[Feature branch]
    end
    subgraph PR["Pull Request"]
        Preview[Netlify Deploy Preview<br/>Supabase: staging project<br/>Stripe: test mode]
        CI[GitHub Actions:<br/>typecheck, build, secret scan]
    end
    subgraph Staging["staging branch"]
        StagingDeploy[Netlify Branch Deploy<br/>Supabase: staging project<br/>Stripe: test mode]
    end
    subgraph Prod["main branch"]
        ProdDeploy[Netlify Production<br/>Supabase: prod project<br/>Stripe: live mode]
    end

    Code -->|open PR| Preview
    Code -->|open PR| CI
    CI -->|pass| Preview
    Preview -->|merge PR| StagingDeploy
    StagingDeploy -->|manual verification| Prod
    Prod --> ProdDeploy
```

Nothing is promoted to `main` without having run, at minimum, against the staging Supabase project in test mode first. Database migrations follow the same path — apply to staging, verify, then apply to production (see [Supabase migration workflow](../vendors/supabase.md#migration-workflow)).
