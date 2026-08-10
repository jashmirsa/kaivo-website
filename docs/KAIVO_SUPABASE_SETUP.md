# KAIVO Supabase setup

KAIVO Phase 1 targets the dedicated Supabase project `pkvcljgvjjwvvqwpsrwu`:

`https://pkvcljgvjjwvvqwpsrwu.supabase.co`

Do not apply these migrations to the unrelated project `mfaxidmzdktqneyhazdh`. That project contains Pianoland and other applications with an incompatible `profiles` table.

## 1. Connect the repository

Install dependencies:

```powershell
npm install
```

Sign in to the Supabase CLI and link only the KAIVO project:

```powershell
npx supabase login
npx supabase link --project-ref pkvcljgvjjwvvqwpsrwu
```

Confirm the linked reference before continuing:

```powershell
npx supabase status
Get-Content supabase\.temp\project-ref
```

The project reference must be `pkvcljgvjjwvvqwpsrwu`.

## 2. Frontend environment

Copy `.env.example` to `.env.local` and set the KAIVO publishable key:

```env
VITE_SUPABASE_URL=https://pkvcljgvjjwvvqwpsrwu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development
```

Find the publishable key in Supabase Dashboard → Settings → API Keys. A legacy anon key can temporarily use `VITE_SUPABASE_ANON_KEY`, but the publishable key is preferred.

Never add a secret key, service-role key, database password, SMTP password, or third-party API secret to a `VITE_` variable. Vite variables are included in the browser bundle.

## 3. Review and apply the migration

The migration is:

`supabase/migrations/20260810011712_kaivo_phase1_foundation.sql`

It creates the KAIVO tables, indexes, triggers, RLS policies, authorization helpers, and private Storage bucket. Apply it only after verifying the linked project reference:

```powershell
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

The schema is designed for a dedicated, initially empty KAIVO project. If a `profiles` or `organizations` table already exists, stop and investigate rather than modifying the migration blindly.

## 4. Deploy Edge Functions

The functions are:

- `provision-kaivo-business`: administrator-only business creation and owner invitation.
- `manage-kaivo-access`: team invitations, reset messages, user disable/enable, and organization suspension/reactivation.

They use the current Supabase `@supabase/server` user-auth mode and authorize every caller inside the function. Deploy them:

```powershell
npx supabase functions deploy provision-kaivo-business --project-ref pkvcljgvjjwvvqwpsrwu
npx supabase functions deploy manage-kaivo-access --project-ref pkvcljgvjjwvvqwpsrwu
```

Modern Supabase projects automatically expose `SUPABASE_PUBLISHABLE_KEYS` and `SUPABASE_SECRET_KEYS` to Edge Functions. Confirm both in Dashboard → Edge Functions → Secrets. For a legacy project, confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available as built-in secrets. Do not commit any of those secret values.

## 5. Configure Auth

In Dashboard → Authentication:

1. Disable public sign-up.
2. Disable anonymous sign-ins.
3. Keep email/password authentication enabled.
4. Set the Site URL for production, for example `https://kaivo.co.za`.
5. Add redirect URLs:
   - `http://localhost:5173/reset-password`
   - `http://127.0.0.1:5173/reset-password`
   - `https://YOUR-PRODUCTION-DOMAIN/reset-password`
6. Use a short access-token lifetime appropriate for the organization’s security policy.
7. Review Auth rate limits before production.

KAIVO has no sign-up UI. Accounts are created through the authenticated provisioning functions.

## 6. Configure invitation email delivery

Supabase’s default email service is intended for testing and is rate-limited. Configure custom SMTP before inviting real clients:

1. Dashboard → Project Settings → Authentication → SMTP Settings.
2. Enter the approved KAIVO SMTP host, port, sender address, username, and password.
3. Set a recognizable sender such as `KAIVO <access@kaivo.co.za>`.
4. Customize the Invite and Reset Password templates with KAIVO branding.
5. Ensure both templates preserve Supabase’s secure confirmation URL variable.
6. Send test invitations to an internal address before inviting a client.

If SMTP is not configured, the UI reports an invitation error; it does not fake delivery.

## 7. Storage

The migration creates a private `kaivo-assets` bucket with a 50 MB file limit. The supported initial MIME types are JPEG, PNG, WebP, SVG, MP4, and PDF.

All paths must follow:

`organizations/{organization_uuid}/assets/...`

or:

`organizations/{organization_uuid}/content/...`

RLS validates the organization ID in the path against the authenticated user’s active membership. Downloads use authenticated Storage requests or short-lived signed URLs; the bucket is never public.

## 8. Create the first super administrator

Do not create an administrator password in SQL.

1. Dashboard → Authentication → Users → Add user.
2. Create your real administrator account and send/complete the secure password flow.
3. Copy the user UUID.
4. Confirm the migration’s Auth trigger created a `public.profiles` row.
5. In SQL Editor, replace the UUID and run:

```sql
update public.profiles
set platform_role = 'super_admin', status = 'active', updated_at = now()
where id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
```

6. Verify exactly one row changed:

```sql
select id, email, platform_role, status
from public.profiles
where id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
```

7. Sign in at `/admin/login`.

Do not place `platform_role` in user metadata. KAIVO authorization reads the protected profile column through RLS/server verification.

## 9. Create the first real business

1. Sign in at `http://localhost:5173/admin/login` as the verified super admin.
2. Open Businesses → Add Business.
3. Complete Business, Brand, Owner, and Confirmation steps.
4. Select “Create Business & Send Invite.”
5. The Edge Function verifies the caller, creates the organization, creates or reuses the Auth user, assigns the owner membership, initializes settings/brand/social rows, and records an activity event.
6. Confirm the owner receives the invitation email.
7. The owner follows the secure link, chooses a password, and signs in at `/login`.
8. KAIVO resolves their membership and opens only their organization workspace.

## 10. Verify RLS and account invitation

Follow [KAIVO_SECURITY_TEST.md](./KAIVO_SECURITY_TEST.md) with two disposable organizations and two disposable users. Do not treat frontend route hiding as a security test.

Also verify:

- An unauthenticated request returns no KAIVO tenant data.
- A business owner cannot open `/admin`.
- An administrator without an organization membership cannot silently impersonate a business.
- A disabled profile cannot access organization rows even with an unexpired browser token.
- A suspended organization is inaccessible to business members.
- Private assets from another organization cannot be downloaded.

## 11. Production checklist

- [ ] The CLI is linked to `pkvcljgvjjwvvqwpsrwu` only.
- [ ] Migration and both Edge Functions are deployed.
- [ ] Security and performance advisors have no unresolved KAIVO findings.
- [ ] Public sign-up and anonymous sign-in are disabled.
- [ ] Production Site URL and redirect allowlist are correct.
- [ ] Custom SMTP and branded templates are tested.
- [ ] Publishable key is in the frontend deployment environment.
- [ ] No secret/service-role key appears in the repository or browser bundle.
- [ ] Tenant-isolation tests pass for database rows and Storage.
- [ ] Production error/log monitoring is configured.
- [ ] Backups and recovery expectations are documented.

No production DNS or infrastructure is changed by this repository setup.
