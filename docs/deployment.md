# Deployment

## Flow

See [architecture/data-flow.md](../architecture/data-flow.md#dev--staging--production-promotion-path) for the full diagram. Summary:

1. Feature branch → PR opened.
2. GitHub Actions runs typecheck, build, secret scan (see [templates/config/github-workflows-ci.yml](../templates/config/github-workflows-ci.yml)).
3. Netlify builds a Deploy Preview automatically, pointed at the staging Supabase project and test-mode Stripe.
4. Reviewer checks the preview URL (posted automatically as a PR comment by Netlify).
5. Merge to `staging` → Netlify branch deploy, same staging backend, used for final pre-release verification.
6. Merge/promote `staging` → `main` → Netlify production deploy, production Supabase project, live-mode Stripe.

## Netlify build configuration

Checked into git as `netlify.toml` (see [templates/config/netlify.toml](../templates/config/netlify.toml)) — never configure build settings only through the dashboard UI, since that's not reviewable in a PR diff and doesn't travel with the repo if you ever migrate.

Minimum required in `netlify.toml`:
- Pinned `NODE_VERSION` — an unpinned Node version was the cause of a real prior production build break when Netlify's default shifted.
- `[build]` command and `publish` directory explicit, not left to auto-detection.
- Security headers block (see [security.md](security.md)) — CSP scoped to only the vendors you actually call (Supabase, Stripe, Plausible, Sentry), plus standard hardening headers.
- `Cache-Control: no-store` on `/api/*` (or your functions path) — API responses should never be CDN- or browser-cached by default.
- Redirects consolidated in `netlify.toml`, not scattered across `_redirects` and dashboard rules.

## Database migrations as part of deployment

Migrations are not run automatically on every deploy by default — run them as an explicit, reviewed step:

```bash
# Against staging, after merging a PR that includes new migrations
supabase link --project-ref <staging-ref>
supabase db push

# Verify, then repeat against production
supabase link --project-ref <prod-ref>
supabase db push
```

If a migration must run automatically (e.g. as a CI step gated to `main`), require it to be idempotent (`IF NOT EXISTS` guards, or Supabase's own migration-tracking table) so a re-run is a no-op, not a duplicate-object error or worse.

## Rollback

- **App code**: Netlify keeps every deploy; rollback is "republish a previous deploy" from the dashboard or `netlify deploy --alias` — near-instant, no rebuild needed.
- **Database migrations**: write a paired `down` migration for anything non-additive (dropping/renaming a column, changing a constraint) before merging the `up` migration, not after something breaks. Purely additive migrations (new table, new nullable column) don't need one.
- **Stripe**: entitlement/webhook bugs are fixed forward, not rolled back — replay missed webhook events from the Stripe dashboard's event log rather than trying to reconstruct state manually.

## Custom domains & DNS

1. Buy the domain wherever (registrar choice doesn't matter much — Namecheap/Cloudflare/Google Domains are all fine).
2. Point DNS at Netlify: either delegate nameservers to Netlify DNS (simplest, Netlify manages everything) or add the specific A/CNAME records Netlify's dashboard provides (if you need to keep DNS elsewhere, e.g. for existing email/MX records).
3. Netlify auto-provisions TLS (Let's Encrypt) once DNS resolves — don't buy a separate SSL cert.
4. If you have existing email on the domain (Google Workspace, etc.), verify MX records aren't overwritten by the Netlify DNS migration — this is the most common way custom-domain setup breaks email delivery.
