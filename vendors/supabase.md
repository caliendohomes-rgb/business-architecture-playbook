# Supabase

## Project setup

Create **two** projects up front, at Day 0, not just one: `<app>-staging` and `<app>-prod`. Retrofitting environment separation after real data exists in a single project is significantly more painful than starting with two. See [environments.md](../docs/environments.md).

## Client separation — the pattern to copy verbatim

Three distinct client constructors, never conflated:

1. **Browser client** — anon key, used in client-side code. RLS-scoped; this is the only client a component should ever import directly.
2. **SSR/cookie-aware server client** — anon key, used in server-rendered pages/middleware to read the user's session from cookies. Still RLS-scoped — it acts *as* the logged-in user, not as an admin.
3. **Admin client** — service role key, used *only* inside Netlify Functions for operations that must bypass RLS (webhook writes, admin actions). Never imported by any client-reachable code path.

```ts
// lib/supabase-browser.ts — safe to import in client components
import { createBrowserClient } from '@supabase/ssr'
export const supabaseBrowser = () =>
  createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  )

// lib/supabase-server.ts — SSR/middleware only, still RLS-scoped (anon key)
import { createServerClient } from '@supabase/ssr'
export const supabaseServer = (cookies: CookieMethods) =>
  createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { cookies }
  )

// lib/supabase-admin.ts — Netlify Functions ONLY. Never import from client code.
import { createClient } from '@supabase/supabase-js'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Self-check: catch the "pasted the anon key into the service-role slot" mistake
// at startup instead of discovering it via a confusing RLS-denied error later.
if (serviceRoleKey.split('.').length !== 3) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT — check for anon-key/service-role-key mixup')
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

The startup self-check is a small thing that directly prevents a real, hard-to-diagnose class of mistake — keep it.

## Auth

- Supabase Auth handles sessions; refresh the session cookie via SSR-aware middleware on authenticated routes only (not on every static asset request — scope it to an allow-list of routes that need a fresh session).
- Prefer magic link / OTP or OAuth over password auth for a new consumer product — fewer credentials to protect, no password-reset flow to build.
- Session JWTs are short-lived; the refresh token lives in an httpOnly cookie, never in localStorage.

## Row Level Security — non-negotiable pattern

Enable RLS in the **same migration** that creates the table — never a follow-up "enable RLS" migration, and never disable it "temporarily" during development.

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can read their own projects"
  on public.projects for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = owner_id);
```

**One policy per operation**, not a single `for all` policy — a `for all` policy that's slightly wrong grants or denies across every operation at once, which is harder to reason about and harder to fix narrowly.

### Role-gated access via a helper function

For anything beyond simple ownership (admin roles, team membership), use a `security definer` helper instead of repeating the same subquery in every policy:

```sql
create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = role_name
  );
$$;

-- Immediately lock down default grants on the function itself
revoke execute on function public.has_role(text) from public, anon, authenticated;
grant execute on function public.has_role(text) to authenticated;
```

`security definer` functions run with the privileges of the function owner, not the caller — always pair one with `set search_path = public` (prevents search-path hijacking) and explicit, narrow `grant`/`revoke` statements. Don't skip the revoke/grant step; Postgres's default grants are broader than you want.

## Migration workflow

Naming: `NNN_description.sql`, zero-padded sequential numbers, descriptive suffix — not the Supabase CLI's default `<timestamp>_<uuid>.sql`, which carries no intent in the filename. One prior project used sequential names successfully; another used CLI-default names and they were unreadable at a glance.

```bash
# Create a new migration
supabase migration new add_projects_table
# → edit the generated file, then rename to NNN_add_projects_table.sql if your CLI doesn't already number it that way

# Apply to staging first
supabase link --project-ref <staging-ref>
supabase db push

# Verify on staging, then apply to production
supabase link --project-ref <prod-ref>
supabase db push
```

Never write a "run these migrations together" combined-apply file as a workaround for migrations that don't apply cleanly in order — that's a signal the migrations themselves aren't properly ordered/idempotent. Fix the migrations, don't paper over it with a bundling script.

Non-additive changes (dropping a column, changing a constraint) get a paired rollback plan written *before* merging, not improvised after something breaks in production — see [deployment.md](../docs/deployment.md#rollback).

## Storage

RLS applies to storage buckets too (via policies on `storage.objects`) — the same ownership pattern as above applies: policy checks `auth.uid()` against a path prefix or a metadata column, not just "any authenticated user can read any file."

## Edge Functions

Not used in any prior project reviewed — Netlify Functions covered every server-side need so far. Reach for Supabase Edge Functions specifically when logic needs to run *close to the database* with minimal latency (e.g. a Postgres trigger invoking a function), not as a default alternative to Netlify Functions.

## Production readiness

- Upgrade the **production** project off the free tier before real user data exists — see [backup-recovery.md](../docs/backup-recovery.md) for why (backup retention).
- Watch Supabase's plan-limit emails (connection count, DB size, API requests) — don't ignore them.
