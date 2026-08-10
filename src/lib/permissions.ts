import type { PermissionName, RoleName } from '../types/saas'

export const rolePermissions: Record<RoleName, PermissionName[]> = {
  super_admin: [
    'business.view',
    'business.edit',
    'analytics.view',
    'content.view',
    'content.create',
    'content.publish',
    'social.manage',
    'staff.view',
    'staff.manage',
    'brand.manage',
    'products.manage',
    'finance.view',
    'settings.manage',
  ],
  kaivo_admin: [
    'business.view',
    'business.edit',
    'analytics.view',
    'content.view',
    'content.create',
    'content.publish',
    'social.manage',
    'staff.view',
    'staff.manage',
    'brand.manage',
    'products.manage',
    'finance.view',
    'settings.manage',
  ],
  support: ['business.view', 'analytics.view', 'content.view', 'staff.view'],
  owner: [
    'business.view',
    'business.edit',
    'analytics.view',
    'content.view',
    'content.create',
    'content.publish',
    'social.manage',
    'staff.view',
    'staff.manage',
    'brand.manage',
    'products.manage',
    'finance.view',
    'settings.manage',
  ],
  administrator: [
    'analytics.view',
    'content.view',
    'content.create',
    'content.publish',
    'social.manage',
    'staff.view',
    'staff.manage',
    'brand.manage',
    'products.manage',
    'settings.manage',
  ],
  manager: ['analytics.view', 'content.view', 'content.create', 'content.publish', 'social.manage'],
  social_media_manager: ['content.view', 'content.create', 'content.publish', 'social.manage', 'brand.manage'],
  staff: ['content.view', 'content.create'],
  finance: ['finance.view', 'business.view'],
  viewer: ['business.view', 'content.view'],
}

export function getPermissionsForRole(role: RoleName): PermissionName[] {
  return rolePermissions[role] ?? []
}

export function hasPermission(permissions: PermissionName[], permission: PermissionName): boolean {
  return permissions.includes(permission)
}
