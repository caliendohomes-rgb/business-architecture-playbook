<!-- Copy to .github/pull_request_template.md in a new project. -->
## What changed

<!-- One or two sentences. -->

## How verified

<!-- Not just "it builds" — what did you actually check? Manual click-through, test added, preview URL tested? -->

## Risk

- [ ] This PR touches checkout, payments, auth, or the data model (schema/RLS changes)

If checked: describe the blast radius if this is wrong, and confirm it was tested against the **staging** Supabase project / **test-mode** Stripe, not production.
