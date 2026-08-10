export type PlatformRole = 'super_admin' | 'kaivo_admin' | 'kaivo_support' | null
export type OrganizationRole = 'owner' | 'manager' | 'social_media_manager' | 'content_creator' | 'designer' | 'staff' | 'viewer'
export type AccountStatus = 'active' | 'invited' | 'suspended' | 'disabled'

export type Profile = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  platform_role: PlatformRole
  status: AccountStatus
  last_active_at: string | null
}

export type Organization = {
  id: string
  name: string
  slug: string
  business_type: string
  industry: string
  logo_url: string | null
  brand_primary_color: string
  brand_secondary_color: string
  brand_description: string
  website: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string
  status: 'active' | 'onboarding' | 'suspended' | 'cancelled'
  subscription_status: string
  created_at: string
}

export type Membership = {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  status: AccountStatus
  organization: Organization
}

export type ContentRecord = {
  id: string
  organization_id: string
  title: string
  caption: string
  hashtags: string[]
  platforms: string[]
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'scheduled' | 'published'
  content_type: string
  media_paths: string[]
  call_to_action: string | null
  destination_url: string | null
  scheduled_for: string | null
  created_at: string
  updated_at: string
}

export type TaskRecord = {
  id: string
  organization_id: string
  title: string
  description: string
  assignee_id: string | null
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  created_at: string
}

export type ActivityRecord = {
  id: string
  organization_id: string | null
  actor_user_id: string | null
  event_type: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}
