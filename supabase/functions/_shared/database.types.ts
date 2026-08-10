export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type ProfileRow = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  platform_role: 'super_admin' | 'kaivo_admin' | 'kaivo_support' | null
  status: 'active' | 'invited' | 'suspended' | 'disabled'
  last_active_at: string | null
  created_at: string
  updated_at: string
}

type OrganizationRow = {
  id: string
  name: string
  slug: string
  business_type: string
  industry: string
  logo_url: string | null
  cover_url: string | null
  brand_primary_color: string
  brand_secondary_color: string
  brand_description: string
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  province: string | null
  country: string
  timezone: string
  currency: string
  status: 'active' | 'onboarding' | 'suspended' | 'cancelled'
  subscription_status: 'pending' | 'trial' | 'active' | 'past_due' | 'cancelled'
  account_manager: string | null
  admin_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type OrganizationMemberRow = {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'manager' | 'social_media_manager' | 'content_creator' | 'designer' | 'staff' | 'viewer'
  permissions: Json
  status: 'active' | 'invited' | 'suspended' | 'disabled'
  joined_at: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

type OrganizationSettingsRow = {
  organization_id: string
  preferred_language: string
  default_cta: string
  notification_preferences: Json
  approval_required: boolean
  created_at: string
  updated_at: string
}

type BrandGuidelinesRow = {
  organization_id: string
  brand_description: string
  brand_voice: string
  target_audience: string
  preferred_language: string
  words_to_use: string[]
  words_to_avoid: string[]
  hashtags: string[]
  default_cta: string
  created_at: string
  updated_at: string
}

type SocialAccountRow = {
  id: string
  organization_id: string
  provider: 'instagram' | 'facebook' | 'tiktok'
  external_account_id: string | null
  display_name: string | null
  status: 'connected' | 'not_connected' | 'connection_error' | 'disabled'
  connection_metadata: Json
  connected_by: string | null
  connected_at: string | null
  created_at: string
  updated_at: string
}

type ActivityLogRow = {
  id: string
  organization_id: string | null
  actor_user_id: string | null
  event_type: string
  entity_type: string
  entity_id: string | null
  metadata: Json
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, {
        id: string
        email: string
        full_name?: string
        avatar_url?: string | null
        phone?: string | null
        platform_role?: ProfileRow['platform_role']
        status?: ProfileRow['status']
        last_active_at?: string | null
      }>
      organizations: Table<OrganizationRow, {
        name: string
        slug: string
        business_type?: string
        industry?: string
        website?: string | null
        phone?: string | null
        email?: string | null
        city?: string | null
        province?: string | null
        country?: string
        brand_primary_color?: string
        brand_secondary_color?: string
        brand_description?: string
        created_by?: string | null
        status?: OrganizationRow['status']
      }>
      organization_members: Table<OrganizationMemberRow, {
        organization_id: string
        user_id: string
        role: OrganizationMemberRow['role']
        status?: OrganizationMemberRow['status']
        joined_at?: string | null
        invited_by?: string | null
        permissions?: Json
      }>
      organization_settings: Table<OrganizationSettingsRow, { organization_id: string }>
      brand_guidelines: Table<BrandGuidelinesRow, { organization_id: string; brand_description?: string }>
      social_accounts: Table<SocialAccountRow, { organization_id: string; provider: SocialAccountRow['provider'] }>
      activity_logs: Table<ActivityLogRow, {
        organization_id?: string | null
        actor_user_id?: string | null
        event_type: string
        entity_type: string
        entity_id?: string | null
        metadata?: Json
      }>
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
