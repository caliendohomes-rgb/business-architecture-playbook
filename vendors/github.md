# GitHub

## Repository settings

Set these on every new repo (see [templates/repository-checklist.md](../templates/repository-checklist.md) for the click-by-click version):

- **Visibility**: private by default. Make public deliberately, when there's a real reason (open source, marketing), never by default and never for a repo that will accumulate real user data or runtime artifacts.
- **Branch protection on `main`** (and `staging`, once it exists):
  - Require a pull request before merging (no direct pushes, including from admins, once you're not the only contributor).
  - Require status checks to pass (the CI workflow) before merging.
  - Require branches to be up to date before merging.
- **Default branch**: `main`.
- **Delete head branches automatically** after merge — keeps the branch list from accumulating cruft.
- **Dependabot alerts + security updates**: on.

## Branching model

Two long-lived branches, everything else short-lived:

- `main` → production (see [environments.md](../docs/environments.md))
- `staging` → staging
- `feature/*`, `fix/*` → short-lived, merged via PR into `staging` first, then `staging` promoted to `main` when ready to release.

Don't add more long-lived branches (no `develop` + `staging` + `main` three-tier model) until a specific coordination problem (e.g. multiple release trains) actually requires it — two was sufficient for every prior project reviewed that had any branching discipline at all.

## GitHub Actions

Minimum CI on every PR (see [templates/config/github-workflows-ci.yml](../templates/config/github-workflows-ci.yml)):

1. Install dependencies
2. Typecheck
3. Build
4. Secret scan (grep-based, see below) — cheap and this exact job would have caught two real incidents in prior projects (a committed `.env` and a committed runtime database)

Add a dependency-audit job as a *gated* check (waiver-file driven) rather than a hard fail on every advisory — a hard fail on every transitive-dependency CVE, including ones with no available fix, trains you to ignore or bypass CI rather than actually respond to it.

### Secret scan pattern (the specific implementation worth reusing)

A simple `grep -rE` across the diff or working tree for patterns like `sk_live_`, `sk_test_`, `whsec_`, `-----BEGIN.*PRIVATE KEY-----`, excluding lockfiles. Not a substitute for `.gitignore` discipline — a backstop for the time it fails. See the full pattern in [templates/config/github-workflows-ci.yml](../templates/config/github-workflows-ci.yml).

### Reusable workflows (once you have more than one venture)

Once running this playbook across multiple businesses, centralize the CI logic itself into a shared `<org>/workflows` repo and have each project's `.github/workflows/ci.yml` be a thin `uses:` stub referencing it. This avoids updating the same CI logic in N repos every time a check improves. Not worth doing for a single project — introduce it when you're maintaining the second or third venture from this template.

## Dependabot

Weekly, grouped minor/patch updates for both npm and github-actions ecosystems (see [templates/config/dependabot.yml](../templates/config/dependabot.yml)). Grouping keeps PR noise down; majors still surface individually since they need a human look.

## PR template

Force two things on every PR (see [templates/config/PULL_REQUEST_TEMPLATE.md](../templates/config/PULL_REQUEST_TEMPLATE.md)):
- How was this verified (not just "it builds")
- An explicit risk flag when the change touches checkout/payments/auth/data model — these categories get extra review attention, everything else doesn't need the ceremony.

## CODEOWNERS

Add once there's more than one contributor — a single-founder repo doesn't need it, but add it the day a second person starts merging code, so review isn't optional-by-forgetfulness.

## Secrets in GitHub Actions

Only add a secret to GitHub Actions if CI actually needs it (e.g. running a migration check against a real Supabase project). Don't mirror every Netlify env var into GitHub "just in case" — see [secrets-management.md](../docs/secrets-management.md#the-one-rule-that-matters-most).
