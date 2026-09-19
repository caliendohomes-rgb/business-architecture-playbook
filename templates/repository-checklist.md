# Repository Checklist

Run through this when creating a new repo for a new venture (from this template).

## Creation

- [ ] `gh repo create <name> --template caliendohomes-rgb/business-architecture-playbook --private --clone`
- [ ] Rename/replace this playbook's docs with the new project's actual `README.md` (keep `docs/`, `vendors/`, `architecture/`, `templates/` if you want the reference material to travel with the repo — or delete them once you've internalized the setup and just keep your own project docs)
- [ ] Set default branch to `main`

## Branch protection (Settings → Branches → Add rule, for `main`)

- [ ] Require a pull request before merging
- [ ] Require status checks to pass before merging (select the CI workflow once it's run at least once)
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above (once you're not the sole contributor)

## Repository settings

- [ ] Visibility: private (make public deliberately later, if ever)
- [ ] Automatically delete head branches after merge: on
- [ ] Dependabot alerts: on
- [ ] Dependabot security updates: on
- [ ] Issues: on (even solo — useful as a personal backlog)

## First commits, in order

- [ ] `.gitignore` (copy from [templates/config/.gitignore](config/.gitignore)) — before anything else
- [ ] `.env.example` (copy from [templates/env.example](../templates/env.example))
- [ ] `.github/workflows/ci.yml` (copy from [templates/config/github-workflows-ci.yml](config/github-workflows-ci.yml))
- [ ] `.github/dependabot.yml` (copy from [templates/config/dependabot.yml](config/dependabot.yml))
- [ ] `.github/pull_request_template.md` (copy from [templates/config/PULL_REQUEST_TEMPLATE.md](config/PULL_REQUEST_TEMPLATE.md))
- [ ] `netlify.toml` (copy from [templates/config/netlify.toml](config/netlify.toml), adjust build command/publish dir for your framework)

## Staging branch

- [ ] Create `staging` branch from `main`, push it
- [ ] Add the same (lighter) branch protection if working with a second contributor

## Verify before writing feature code

- [ ] CI runs and passes on a trivial PR (e.g. editing the README)
- [ ] Secret-scan job specifically confirmed to fail on a deliberately-committed fake secret (test it once, then revert), so you know it actually works before trusting it
