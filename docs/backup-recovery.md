# Backup & Disaster Recovery

## Database (Supabase)

- **Automatic backups**: enabled by default on paid Supabase tiers (daily, retained per plan — check the current retention window for your plan, it varies). The free tier has much shorter/no retention — this alone is a reason to upgrade the *production* project's plan before real user data exists, even if staging stays on the free tier.
- **Point-in-time recovery (PITR)**: available on higher tiers — worth it once losing even a few hours of data would be a real business problem, not just an inconvenience.
- **Verify restorability, not just "backups are enabled."** An untested backup is a hope, not a plan. At least once before launch, and periodically after: restore a backup into a scratch Supabase project and confirm the data actually comes back intact. None of the prior projects reviewed had evidence this was ever tested.
- **Migrations are also a backup mechanism** — a clean, ordered migration history means you can reconstruct schema from scratch even in a total-loss scenario, independent of Supabase's own backups.

## File storage (Supabase Storage)

Storage buckets are not automatically included in the same backup story as the database in all plans — check what your specific plan covers. For anything irreplaceable (user uploads that can't be regenerated), consider a periodic export to a second location (e.g. a scheduled function copying to S3/Backblaze) if the built-in coverage doesn't meet your risk tolerance.

## Code

Git is the backup for code — this is already solved as long as you push regularly and don't rely on uncommitted local work. GitHub itself is a single point of failure for the *hosting* of that history (not the content, since every clone has full history) — not worth mitigating below early production scale.

## Vendor account recovery

- Use a real, monitored email (not a personal inbox nobody checks) as the account owner for Netlify/Supabase/Stripe/GitHub — losing access to the account-recovery email is a bigger risk than most technical failure modes.
- Enable 2FA on every vendor account, and store recovery codes somewhere durable (password manager, not a text file in the repo).
- For a team of more than one, add a second admin/owner on each vendor account — single-person bus-factor on account access is a real early-production risk.

## Disaster recovery checklist (early production)

- [ ] Production Supabase project is on a plan with backups + retention appropriate to how much data loss you can tolerate
- [ ] A restore has actually been tested, not just assumed to work
- [ ] Migration history is clean and could rebuild schema from scratch
- [ ] 2FA enabled on GitHub, Netlify, Supabase, Stripe
- [ ] A second human has admin access to each vendor account (or you've explicitly accepted the bus-factor risk)
- [ ] Recovery codes/backup access stored in a password manager, not in the repo or a plain text file
