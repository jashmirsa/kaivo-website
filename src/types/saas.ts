export type RoleName =
  | 'super_admin'
  | 'kaivo_admin'
  | 'support'
  | 'owner'
  | 'administrator'
  | 'manager'
  | 'social_media_manager'
  | 'staff'
  | 'finance'
  | 'viewer'

export type PermissionName =
  | 'business.view'
  | 'business.edit'
  | 'analytics.view'
  | 'content.view'
  | 'content.create'
  | 'content.publish'
  | 'social.manage'
  | 'staff.view'
  | 'staff.manage'
  | 'brand.manage'
  | 'products.manage'
  | 'finance.view'
  | 'settings.manage'

export type BusinessStatus = 'pending' | 'trial' | 'active' | 'suspended' | 'cancelled'
export type ModuleKey =
  | 'overview'
  | 'ai'
  | 'content'
  | 'social'
  | 'calendar'
  | 'brand'
  | 'products'
  | 'staff'
  | 'analytics'
  | 'files'
  | 'settings'

export interface PermissionDefinition {
  id: string
  name: PermissionName
  description: string
}

export interface RoleDefinition {
  id: string
  name: RoleName
  label: string
  description: string
  permissions: PermissionName[]
}

export interface Business {
  id: string
  name: string
  tradingName: string
  industry: string
  businessType: string
  plan: string
  status: BusinessStatus
  ownerEmail: string
  city: string
  country: string
  timezone: string
  currency: string
  accentColor: string
  createdAt: string
  lastLogin: string
  staffCount: number
  socialConnections: number
  aiUsage: number
}

export interface AppUser {
  id: string
  email: string
  fullName: string
  role: RoleName
  businessId?: string
  permissions: PermissionName[]
}

export interface ContentItem {
  id: number
  title: string
  channel: string
  status: 'Published' | 'Scheduled' | 'Draft'
  updated: string
}

export interface ProductItem {
  id: number
  name: string
  category: string
  price: string
  status: 'Live' | 'Draft'
}

export interface ActivityLog {
  id: number
  actor: string
  action: string
  detail: string
}
