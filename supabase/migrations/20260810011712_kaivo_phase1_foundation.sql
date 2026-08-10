-- KAIVO Phase 1: multi-tenant production foundation.
-- Apply to a dedicated KAIVO Supabase project, not a shared database.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists kaivo_private;
revoke all on schema kaivo_private from public, anon, authenticated;
grant usage on schema kaivo_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  phone text,
  platform_role text check (platform_role is null or platform_role in ('super_admin', 'kaivo_admin', 'kaivo_support')),
  status text not null default 'invited' check (status in ('active', 'invited', 'suspended', 'disabled')),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));
create index profiles_platform_role_idx on public.profiles (platform_role) where platform_role is not null;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_type text not null default '',
  industry text not null default '',
  logo_url text,
  cover_url text,
  brand_primary_color text not null default '#5B5CE2' check (brand_primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  brand_secondary_color text not null default '#0A0B0D' check (brand_secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  brand_description text not null default '',
  website text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  country text not null default 'South Africa',
  timezone text not null default 'Africa/Johannesburg',
  currency text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'onboarding' check (status in ('active', 'onboarding', 'suspended', 'cancelled')),
  subscription_status text not null default 'pending' check (subscription_status in ('pending', 'trial', 'active', 'past_due', 'cancelled')),
  account_manager uuid references auth.users(id) on delete set null,
  admin_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_status_idx on public.organizations (status);
create index organizations_created_at_idx on public.organizations (created_at desc);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'social_media_manager', 'content_creator', 'designer', 'staff', 'viewer')),
  permissions jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions) = 'object'),
  status text not null default 'invited' check (status in ('active', 'invited', 'suspended', 'disabled')),
  joined_at timestamptz,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_organization_idx on public.organization_members (organization_id);
create index organization_members_user_idx on public.organization_members (user_id);
create index organization_members_active_user_idx on public.organization_members (user_id, organization_id) where status = 'active';

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  preferred_language text not null default 'English',
  default_cta text not null default '',
  notification_preferences jsonb not null default '{}'::jsonb,
  approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role_title text not null default '',
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staff_members_organization_idx on public.staff_members (organization_id);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('instagram', 'facebook', 'tiktok')),
  external_account_id text,
  display_name text,
  status text not null default 'not_connected' check (status in ('connected', 'not_connected', 'connection_error', 'disabled')),
  connection_metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);
create index social_accounts_organization_idx on public.social_accounts (organization_id);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  caption text not null default '',
  hashtags text[] not null default '{}',
  platforms text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published')),
  content_type text not null default 'post' check (content_type in ('post', 'story', 'reel', 'tiktok', 'promotion', 'announcement', 'special', 'event')),
  media_paths text[] not null default '{}',
  call_to_action text,
  destination_url text,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  assigned_to uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  changes_requested_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_items_organization_idx on public.content_items (organization_id);
create index content_items_org_status_idx on public.content_items (organization_id, status);
create index content_items_scheduled_for_idx on public.content_items (scheduled_for) where scheduled_for is not null;

create table public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  title text not null,
  event_type text not null default 'content' check (event_type in ('content', 'campaign', 'business_date')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_calendar_org_start_idx on public.content_calendar (organization_id, starts_at);

create table public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict default auth.uid(),
  decision text not null check (decision in ('approved', 'changes_requested')),
  reason text,
  created_at timestamptz not null default now()
);
create index content_approvals_content_idx on public.content_approvals (content_item_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_organization_idx on public.tasks (organization_id);
create index tasks_org_status_idx on public.tasks (organization_id, status);
create index tasks_assignee_idx on public.tasks (assignee_id) where assignee_id is not null;

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  asset_type text not null check (asset_type in ('logo', 'product_photo', 'menu', 'campaign', 'video', 'document', 'template', 'content_media')),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now()
);
create index brand_assets_organization_idx on public.brand_assets (organization_id, created_at desc);

create table public.brand_guidelines (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  brand_description text not null default '',
  brand_voice text not null default '',
  target_audience text not null default '',
  preferred_language text not null default 'English',
  words_to_use text[] not null default '{}',
  words_to_avoid text[] not null default '{}',
  hashtags text[] not null default '{}',
  default_cta text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index activity_logs_organization_idx on public.activity_logs (organization_id, created_at desc);
create index activity_logs_created_at_idx on public.activity_logs (created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_organization_idx on public.notifications (organization_id);

-- Privileged authorization helpers live outside the exposed public schema.
create or replace function kaivo_private.current_user_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status in ('active', 'invited')
  );
$$;

create or replace function kaivo_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
      and p.platform_role in ('super_admin', 'kaivo_admin')
  );
$$;

create or replace function kaivo_private.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
      and p.platform_role in ('super_admin', 'kaivo_admin', 'kaivo_support')
  );
$$;

create or replace function kaivo_private.is_org_member(requested_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select kaivo_private.current_user_active() and exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = requested_org_id
      and m.user_id = (select auth.uid())
      and m.status in ('active', 'invited')
      and o.status in ('active', 'onboarding')
  );
$$;

create or replace function kaivo_private.has_org_role(requested_org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select kaivo_private.current_user_active() and exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = requested_org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
      and o.status in ('active', 'onboarding')
  );
$$;

create or replace function kaivo_private.shares_org(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
      and mine.status = 'active'
      and theirs.status in ('active', 'invited')
  );
$$;

create or replace function kaivo_private.storage_org_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare parsed uuid;
begin
  if split_part(object_name, '/', 1) <> 'organizations' then return null; end if;
  begin parsed := split_part(object_name, '/', 2)::uuid;
  exception when invalid_text_representation then return null;
  end;
  return parsed;
end;
$$;

revoke all on all functions in schema kaivo_private from public, anon, authenticated;
grant execute on function kaivo_private.current_user_active() to authenticated;
grant execute on function kaivo_private.is_platform_admin() to authenticated;
grant execute on function kaivo_private.is_platform_staff() to authenticated;
grant execute on function kaivo_private.is_org_member(uuid) to authenticated;
grant execute on function kaivo_private.has_org_role(uuid, text[]) to authenticated;
grant execute on function kaivo_private.shares_org(uuid) to authenticated;
grant execute on function kaivo_private.storage_org_id(text) to authenticated;

-- Auth lifecycle. Authorization fields are never sourced from user-editable metadata.
create or replace function kaivo_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, status)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''),
    case when new.email_confirmed_at is null then 'invited' else 'active' end)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create or replace function kaivo_private.handle_confirmed_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set status = 'active', updated_at = now() where id = new.id and status = 'invited';
    update public.organization_members set status = 'active', joined_at = coalesce(joined_at, now()), updated_at = now()
      where user_id = new.id and status = 'invited';
  end if;
  return new;
end;
$$;

revoke all on function kaivo_private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function kaivo_private.handle_confirmed_auth_user() from public, anon, authenticated;

create trigger kaivo_auth_user_created
  after insert on auth.users
  for each row execute function kaivo_private.handle_new_auth_user();
create trigger kaivo_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function kaivo_private.handle_confirmed_auth_user();

create or replace function kaivo_private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'organizations', 'organization_members', 'organization_settings',
    'staff_members', 'social_accounts', 'content_items', 'content_calendar',
    'tasks', 'brand_guidelines'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function kaivo_private.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function kaivo_private.enforce_content_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if new.organization_id <> old.organization_id or new.created_by <> old.created_by then
    raise exception 'Content ownership cannot be reassigned';
  end if;
  if new.status is distinct from old.status and new.status in ('approved', 'changes_requested', 'published') then
    if not kaivo_private.has_org_role(new.organization_id, array['owner', 'manager']) then
      raise exception 'Only an owner or manager can approve or publish content';
    end if;
    if new.status = 'approved' then
      new.approved_by := (select auth.uid());
      new.approved_at := now();
    end if;
    if new.status in ('approved', 'changes_requested') then
      insert into public.content_approvals (organization_id, content_item_id, reviewer_id, decision, reason)
      values (new.organization_id, new.id, (select auth.uid()), new.status, new.changes_requested_reason);
    end if;
  end if;
  if new.status is distinct from old.status and new.status = 'scheduled' then
    if not kaivo_private.has_org_role(new.organization_id, array['owner', 'manager', 'social_media_manager']) then
      raise exception 'You are not authorized to schedule content';
    end if;
    if old.status <> 'approved' and not kaivo_private.has_org_role(new.organization_id, array['owner', 'manager']) then
      raise exception 'Content must be approved before it can be scheduled';
    end if;
  end if;
  return new;
end;
$$;
create trigger enforce_content_workflow before update on public.content_items
for each row execute function kaivo_private.enforce_content_workflow();

create or replace function kaivo_private.log_tenant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.activity_logs (organization_id, actor_user_id, event_type, entity_type, entity_id)
    values (old.organization_id, (select auth.uid()), tg_table_name || '_delete', tg_table_name, old.id);
    return old;
  end if;
  insert into public.activity_logs (organization_id, actor_user_id, event_type, entity_type, entity_id)
  values (new.organization_id, (select auth.uid()), tg_table_name || '_' || lower(tg_op), tg_table_name, new.id);
  return new;
end;
$$;
revoke all on function kaivo_private.log_tenant_change() from public, anon, authenticated;
create trigger log_content_changes after insert or update or delete on public.content_items for each row execute function kaivo_private.log_tenant_change();
create trigger log_task_changes after insert or update or delete on public.tasks for each row execute function kaivo_private.log_tenant_change();
create trigger log_social_changes after insert or update or delete on public.social_accounts for each row execute function kaivo_private.log_tenant_change();

create or replace function kaivo_private.notify_content_workflow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'in_review' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.notifications (organization_id, user_id, type, title, body, entity_type, entity_id)
    select new.organization_id, m.user_id, 'content_requires_approval', 'Content requires approval', new.title, 'content_item', new.id
    from public.organization_members m
    where m.organization_id = new.organization_id and m.status = 'active' and m.role in ('owner', 'manager');
  elsif new.status in ('approved', 'changes_requested') and old.status is distinct from new.status then
    insert into public.notifications (organization_id, user_id, type, title, body, entity_type, entity_id)
    values (
      new.organization_id,
      new.created_by,
      case when new.status = 'approved' then 'content_approved' else 'content_changes_requested' end,
      case when new.status = 'approved' then 'Content approved' else 'Changes requested' end,
      new.title,
      'content_item',
      new.id
    );
  end if;
  return new;
end;
$$;
revoke all on function kaivo_private.notify_content_workflow() from public, anon, authenticated;
create trigger notify_content_workflow after insert or update of status on public.content_items for each row execute function kaivo_private.notify_content_workflow();

create or replace function kaivo_private.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id) then
    insert into public.notifications (organization_id, user_id, type, title, body, entity_type, entity_id)
    values (new.organization_id, new.assignee_id, 'task_assigned', 'Task assigned', new.title, 'task', new.id);
  end if;
  return new;
end;
$$;
revoke all on function kaivo_private.notify_task_assignment() from public, anon, authenticated;
create trigger notify_task_assignment after insert or update of assignee_id on public.tasks for each row execute function kaivo_private.notify_task_assignment();

-- RLS is enabled on every exposed KAIVO table.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.staff_members enable row level security;
alter table public.social_accounts enable row level security;
alter table public.content_items enable row level security;
alter table public.content_calendar enable row level security;
alter table public.content_approvals enable row level security;
alter table public.tasks enable row level security;
alter table public.brand_assets enable row level security;
alter table public.brand_guidelines enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or kaivo_private.is_platform_staff() or kaivo_private.shares_org(id));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid()) and kaivo_private.current_user_active())
with check (id = (select auth.uid()) and kaivo_private.current_user_active());

create policy organizations_select on public.organizations for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
using (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(id, array['owner', 'manager']))
with check (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(id, array['owner', 'manager']));

create policy members_select on public.organization_members for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));

create policy organization_settings_select on public.organization_settings for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy organization_settings_update on public.organization_settings for update to authenticated
using (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager']))
with check (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager']));

create policy staff_select on public.staff_members for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy staff_manage on public.staff_members for all to authenticated
using (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager']))
with check (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager']));

create policy social_select on public.social_accounts for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy social_manage on public.social_accounts for all to authenticated
using (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager']))
with check (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager']));

create policy content_select on public.content_items for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy content_insert on public.content_items for insert to authenticated
with check (created_by = (select auth.uid()) and kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer'])));
create policy content_update on public.content_items for update to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer']))
with check (kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer']));
create policy content_delete on public.content_items for delete to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager']) or (created_by = (select auth.uid()) and status = 'draft'));

create policy calendar_select on public.content_calendar for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy calendar_manage on public.content_calendar for all to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator']))
with check (created_by = (select auth.uid()) and kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator'])));

create policy approvals_select on public.content_approvals for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy approvals_insert on public.content_approvals for insert to authenticated
with check (reviewer_id = (select auth.uid()) and kaivo_private.has_org_role(organization_id, array['owner', 'manager']));

create policy tasks_select on public.tasks for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy tasks_insert on public.tasks for insert to authenticated
with check (created_by = (select auth.uid()) and kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'staff'])));
create policy tasks_update on public.tasks for update to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager']) or assignee_id = (select auth.uid()))
with check (kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager']) or assignee_id = (select auth.uid()));
create policy tasks_delete on public.tasks for delete to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager']) or created_by = (select auth.uid()));

create policy assets_select on public.brand_assets for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy assets_insert on public.brand_assets for insert to authenticated
with check (uploaded_by = (select auth.uid()) and kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer'])));
create policy assets_delete on public.brand_assets for delete to authenticated
using (kaivo_private.has_org_role(organization_id, array['owner', 'manager']) or uploaded_by = (select auth.uid()));

create policy guidelines_select on public.brand_guidelines for select to authenticated
using (kaivo_private.is_platform_staff() or kaivo_private.is_org_member(organization_id));
create policy guidelines_update on public.brand_guidelines for update to authenticated
using (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'designer']))
with check (kaivo_private.is_platform_admin() or kaivo_private.has_org_role(organization_id, array['owner', 'manager', 'social_media_manager', 'designer']));

create policy activity_select on public.activity_logs for select to authenticated
using (kaivo_private.is_platform_staff() or (organization_id is not null and kaivo_private.is_org_member(organization_id)));

create policy notifications_select on public.notifications for select to authenticated
using (user_id = (select auth.uid()) and kaivo_private.current_user_active());
create policy notifications_update on public.notifications for update to authenticated
using (user_id = (select auth.uid()) and kaivo_private.current_user_active())
with check (user_id = (select auth.uid()) and kaivo_private.current_user_active());

-- Explicit Data API grants. RLS remains the row-level security boundary.
revoke all on all tables in schema public from anon;
grant select on public.profiles, public.organizations, public.organization_members,
  public.organization_settings, public.staff_members, public.social_accounts,
  public.content_items, public.content_calendar, public.content_approvals,
  public.tasks, public.brand_assets, public.brand_guidelines,
  public.activity_logs, public.notifications to authenticated;
grant update (full_name, avatar_url, phone, last_active_at) on public.profiles to authenticated;
grant update (name, business_type, industry, logo_url, cover_url, brand_primary_color,
  brand_secondary_color, brand_description, website, email, phone, address, city,
  province, country, timezone, currency) on public.organizations to authenticated;
grant update on public.organization_settings, public.staff_members, public.social_accounts,
  public.content_items, public.content_calendar, public.tasks, public.brand_guidelines,
  public.notifications to authenticated;
grant insert on public.staff_members, public.social_accounts, public.content_items,
  public.content_calendar, public.content_approvals, public.tasks, public.brand_assets to authenticated;
grant delete on public.staff_members, public.social_accounts, public.content_items,
  public.content_calendar, public.tasks, public.brand_assets to authenticated;

-- Private, organization-scoped Storage bucket and policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kaivo-assets', 'kaivo-assets', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4', 'application/pdf']
)
on conflict (id) do nothing;

create policy kaivo_assets_select on storage.objects for select to authenticated
using (bucket_id = 'kaivo-assets' and kaivo_private.is_org_member(kaivo_private.storage_org_id(name)));
create policy kaivo_assets_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'kaivo-assets'
  and owner_id = (select auth.uid())::text
  and kaivo_private.has_org_role(kaivo_private.storage_org_id(name), array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer'])
);
create policy kaivo_assets_update on storage.objects for update to authenticated
using (
  bucket_id = 'kaivo-assets'
  and kaivo_private.has_org_role(kaivo_private.storage_org_id(name), array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer'])
)
with check (
  bucket_id = 'kaivo-assets'
  and kaivo_private.has_org_role(kaivo_private.storage_org_id(name), array['owner', 'manager', 'social_media_manager', 'content_creator', 'designer'])
);
create policy kaivo_assets_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'kaivo-assets'
  and (owner_id = (select auth.uid())::text or kaivo_private.has_org_role(kaivo_private.storage_org_id(name), array['owner', 'manager']))
);
