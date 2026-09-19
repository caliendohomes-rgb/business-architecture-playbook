// Three Supabase client constructors, never conflated. See vendors/supabase.md for the full rationale.
// Adjust the env var access pattern (import.meta.env vs process.env) to your framework.

// ---- lib/supabase-browser.ts — safe to import in client components ----
import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = () =>
  createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  )

// ---- lib/supabase-server.ts — SSR/middleware only, still RLS-scoped (anon key) ----
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'

export const supabaseServer = (cookies: CookieMethodsServer) =>
  createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { cookies }
  )

// ---- lib/supabase-admin.ts — Netlify Functions ONLY. Never import from client-reachable code. ----
import { createClient } from '@supabase/supabase-js'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Self-check: catches the "pasted the anon key into the service-role slot" mistake at
// startup instead of surfacing as a confusing RLS-denied error later.
if (serviceRoleKey.split('.').length !== 3) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT — check for anon-key/service-role-key mixup'
  )
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
