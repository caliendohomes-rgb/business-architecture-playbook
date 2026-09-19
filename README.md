# Business Setup Architecture Playbook

A reusable reference architecture and operational playbook for launching a new software business from a blank GitHub account to an early-production deployment — without over-building for scale you don't have yet.

This is a **GitHub template repository**. Use it as the starting point for every new venture:

```bash
gh repo create <new-business-name> --template caliendohomes-rgb/business-architecture-playbook --private --clone
```

Then work through [templates/launch-checklist.md](templates/launch-checklist.md) top to bottom.

## Why this exists

This playbook is distilled from a review of ~12 prior projects (SaaS products, internal tools, personal automation) built with a consistent-ish but never-standardized stack: GitHub, Netlify, Supabase, Stripe. Some of those projects did things very well — one in particular (`standardcraft`) reached genuine production-grade practices around RLS, webhook idempotency, and CI secret scanning. Most of the others skipped CI entirely, never separated environments, or accidentally committed things that shouldn't have been committed.

The goal here is to stop re-deriving the same decisions (and re-making the same mistakes) on every new business, by writing down:

- **One opinionated default architecture** — what to use, in what order, and why.
- **The exact setup sequence** — account creation order, repo settings, first commits.
- **Copy-paste-ready config templates** — `netlify.toml`, CI workflow, RLS policy patterns, Stripe webhook handler.
- **Checkpoints** — what "MVP done" and "production ready" actually mean, concretely.
- **Explicit anti-patterns** — the specific mistakes found in prior repos, so they don't repeat.

## How to use this repo

| If you're... | Start here |
|---|---|
| Starting a brand-new venture | [templates/launch-checklist.md](templates/launch-checklist.md) |
| Deciding on the tech stack | [architecture/reference-architecture.md](architecture/reference-architecture.md) |
| Setting up a new GitHub repo | [vendors/github.md](vendors/github.md) + [templates/repository-checklist.md](templates/repository-checklist.md) |
| Wiring up Supabase | [vendors/supabase.md](vendors/supabase.md) |
| Wiring up Stripe billing | [vendors/stripe.md](vendors/stripe.md) |
| Deploying to Netlify | [vendors/netlify.md](vendors/netlify.md) |
| Checking if you're ready to launch | [templates/production-readiness-checklist.md](templates/production-readiness-checklist.md) |
| Doing a security pass | [templates/security-checklist.md](templates/security-checklist.md) + [docs/security.md](docs/security.md) |
| Wondering "why did we pick X over Y" | [docs/architecture-decisions.md](docs/architecture-decisions.md) |

## Repository structure

```text
business-architecture-playbook/
├── README.md                          — you are here
├── docs/                               — cross-cutting operational guidance
│   ├── architecture-overview.md
│   ├── architecture-decisions.md       — ADR-style decision log
│   ├── startup-checklist.md
│   ├── production-readiness.md
│   ├── security.md
│   ├── environments.md
│   ├── secrets-management.md
│   ├── deployment.md
│   ├── monitoring.md
│   ├── backup-recovery.md
│   └── cost-management.md
├── vendors/                            — one file per vendor, deep-dive config
│   ├── github.md
│   ├── netlify.md
│   ├── supabase.md
│   ├── stripe.md
│   └── other-services.md
├── architecture/
│   ├── reference-architecture.md       — the opinionated default stack
│   ├── data-flow.md
│   └── diagrams/                       — standalone Mermaid sources
├── templates/                          — copy these into a new project
│   ├── env.example
│   ├── repository-checklist.md
│   ├── launch-checklist.md
│   ├── security-checklist.md
│   ├── production-readiness-checklist.md
│   └── config/                         — actual files to copy verbatim
└── examples/
    └── recommended-project-structure.md
```

## Maturity stages this playbook covers

1. **Day 0** — account/tool bootstrap, before any code
2. **MVP** — first deployed, usable version, pre-revenue or pre-real-users
3. **Early production** — real customers, real payments, real data at stake
4. **Growth triggers** — signals that say "this default no longer fits, reconsider"

Each doc calls out which stage its guidance applies to. Don't build stage-4 infrastructure at stage-1 — that's the single most common failure mode this playbook exists to prevent.

## What this playbook is not

- Not a no-code/low-code guide — it assumes you're writing code.
- Not enterprise architecture — it deliberately avoids Kubernetes, multi-region, service meshes, and anything else that isn't justified below ~$50k MRR or a specific compliance trigger.
- Not vendor-neutral — it picks defaults. Alternatives are named where they matter, but this is meant to remove decisions, not present a menu.

## Maintaining this repo

This is a living document. When a new business surfaces a pattern worth generalizing — or hits a wall this architecture didn't anticipate — bring the lesson back here via a PR, not just into that one project. See [docs/architecture-decisions.md](docs/architecture-decisions.md) for how to record a new decision or revise an old one.
