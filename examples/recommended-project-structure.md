# Recommended Project Structure

For a new venture built from this template, once you've moved past the playbook docs into actual product code. This is a shape, not a rigid mandate — adjust for your framework's own conventions (this assumes an Astro/Vite-style app with Netlify Functions, the pattern the reference implementation used; a Next.js app collapses `netlify/functions/` into `app/api/` routes instead).

```text
your-app/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    — from templates/config/github-workflows-ci.yml
│   ├── dependabot.yml                — from templates/config/dependabot.yml
│   └── pull_request_template.md      — from templates/config/PULL_REQUEST_TEMPLATE.md
├── netlify/
│   └── functions/
│       ├── checkout.ts               — Stripe Checkout Session creation
│       ├── webhook.ts                — Stripe webhook handler (signature-verified)
│       └── ...                       — any other server-only logic needing secrets
├── src/
│   ├── lib/
│   │   ├── supabase-browser.ts       — anon key, client-side
│   │   ├── supabase-server.ts        — anon key, SSR/middleware
│   │   └── supabase-admin.ts         — service role key, imported ONLY by netlify/functions/*
│   ├── pages/ (or app/, routes/ — framework-dependent)
│   └── middleware.ts                 — session refresh, scoped to authenticated routes only
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_projects_table.sql
│       └── ...                       — sequential, descriptive names, RLS enabled from 001
├── docs/                             — project-specific docs (keep this playbook's docs/ as a reference alongside, or fold relevant parts in)
├── .env.example
├── .gitignore                        — from templates/config/.gitignore
├── netlify.toml                      — from templates/config/netlify.toml
├── package.json
└── README.md
```

## Notes

- **One Supabase client file per trust level**, never one file that exports both an anon-key and service-role-key client — the separation is the whole point (see [vendors/supabase.md](../vendors/supabase.md)).
- **`netlify/functions/` is the only place secret env vars are read.** If you find yourself importing `supabase-admin.ts` from anything under `src/pages/` or `src/components/`, that's a sign the logic belongs in a function instead.
- **Migrations live in the app repo**, not a separate "infra" repo — schema and application code should version together; a migration and the code that depends on it merge in the same PR.
- Keep this playbook's own `docs/`, `vendors/`, `architecture/`, `templates/` directories around in the new repo only as long as they're useful as a reference; once the setup is done and internalized, it's fine to delete them and keep just your project-specific docs — the source of truth stays in the template repo itself.
