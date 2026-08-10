# KAIVO tenant-isolation security test

Run this procedure against a development Supabase branch or disposable KAIVO project before production. Never use real client data.

## Prepare two tenants

1. Create Organization A and invite User A through the KAIVO Admin UI.
2. Create Organization B and invite User B through the KAIVO Admin UI.
3. Complete both invitation/password flows.
4. Record both organization UUIDs.
5. Upload one private asset to each organization.
6. Create one content item and one task in each organization.

## Capture user-scoped clients

Use two separate private/incognito browser profiles or two small Node scripts using only the project publishable key. Sign in normally as User A and User B. Never use a secret/service-role key for the test queries.

## User A must pass these positive checks

- Select their own `organization_members` row.
- Select Organization A.
- Create/read permitted Organization A content and tasks.
- Upload and download `organizations/{ORG_A}/assets/test-a.png`.

## User A must fail these cross-tenant checks

Using the normal Supabase JS client signed in as User A, directly issue:

```ts
await supabase.from('organizations').select('*').eq('id', ORG_B)
await supabase.from('organization_members').select('*').eq('organization_id', ORG_B)
await supabase.from('content_items').select('*').eq('organization_id', ORG_B)
await supabase.from('content_items').insert({ organization_id: ORG_B, title: 'RLS attack', created_by: userA.id })
await supabase.from('tasks').update({ title: 'Changed by A' }).eq('organization_id', ORG_B)
await supabase.from('brand_assets').delete().eq('organization_id', ORG_B)
await supabase.storage.from('kaivo-assets').download(`organizations/${ORG_B}/assets/test-b.png`)
```

Expected results:

- Cross-tenant selects return zero rows.
- Inserts/updates/deletes fail with an RLS/permission error or affect zero rows.
- The Storage download fails.
- No Organization B value is visible in network responses.

Repeat the same test as User B against Organization A.

## Role escalation checks

As a business user, verify direct requests cannot:

- Insert or update `organization_members`.
- Change `profiles.platform_role`.
- Change their organization role to `owner`.
- Set another user’s profile status.
- Approve content unless their verified role is owner or manager.
- Schedule unapproved content as a social media manager.
- Set content to published through a normal client request.

## Disabled and suspended access

1. Sign in as User A and leave the session open.
2. Disable User A from Admin.
3. Without signing User A out manually, repeat organization queries. They must fail/return no rows because RLS checks profile status on each request.
4. Re-enable User A, refresh the session, and verify access returns.
5. Suspend Organization A. User A’s tenant queries and Storage downloads must fail.
6. Reactivate Organization A and verify access returns.

## Evidence to retain

Record the test date, project/branch reference, migration version, tester, affected-row counts, and sanitized screenshots of failed cross-tenant responses. Do not store access tokens or secrets in the evidence.
