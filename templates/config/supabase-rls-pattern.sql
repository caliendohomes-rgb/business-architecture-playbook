-- Reference RLS pattern. See vendors/supabase.md for full rationale.
-- Enable RLS in the SAME migration that creates the table. One policy per operation.

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

-- Role-gated access via a SECURITY DEFINER helper, for anything beyond simple ownership
-- (admin roles, team membership). Avoids repeating the same subquery in every policy.

create table public.user_roles (
  user_id uuid not null references auth.users(id),
  role text not null,
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users can read their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

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

-- Lock down default grants immediately — Postgres's defaults are broader than you want.
revoke execute on function public.has_role(text) from public, anon, authenticated;
grant execute on function public.has_role(text) to authenticated;

-- Example use in another table's policy:
-- create policy "Admins can read all projects"
--   on public.projects for select
--   using (public.has_role('admin'));
