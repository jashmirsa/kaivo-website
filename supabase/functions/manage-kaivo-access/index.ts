import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

type AccessAction = 'invite_member' | 'resend_invitation' | 'send_password_reset' | 'disable_user' | 'enable_user' | 'suspend_organization' | 'reactivate_organization'
type AccessRequest = {
  action: AccessAction
  organizationId: string
  targetUserId?: string
  email?: string
  fullName?: string
  role?: 'manager' | 'social_media_manager' | 'content_creator' | 'designer' | 'staff' | 'viewer'
  redirectTo?: string
}

const fail = (message: string, status = 400) => Response.json({ error: message }, { status })

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return fail('Method not allowed', 405)
    const callerId = ctx.userClaims?.sub
    if (!callerId) return fail('Authentication required', 401)

    let payload: AccessRequest
    try { payload = await req.json() } catch { return fail('Invalid JSON body') }
    if (!payload.organizationId || !payload.action) return fail('Organization and action are required')

    const [{ data: caller }, { data: membership }] = await Promise.all([
      ctx.supabaseAdmin.from('profiles').select('platform_role,status').eq('id', callerId).single(),
      ctx.supabaseAdmin.from('organization_members').select('role,status').eq('organization_id', payload.organizationId).eq('user_id', callerId).maybeSingle(),
    ])
    const isAdmin = caller?.status === 'active' && ['super_admin', 'kaivo_admin'].includes(caller.platform_role ?? '')
    const canManageTeam = membership?.status === 'active' && ['owner', 'manager'].includes(membership.role)
    if (!isAdmin && !canManageTeam) return fail('You are not authorized to manage access', 403)

    if (['suspend_organization', 'reactivate_organization'].includes(payload.action)) {
      if (!isAdmin) return fail('Only KAIVO administrators can change organization access', 403)
      const status = payload.action === 'suspend_organization' ? 'suspended' : 'active'
      const { error } = await ctx.supabaseAdmin.from('organizations').update({ status }).eq('id', payload.organizationId)
      if (error) return fail('Organization access could not be updated', 500)
      await ctx.supabaseAdmin.from('activity_logs').insert({ organization_id: payload.organizationId, actor_user_id: callerId, event_type: payload.action, entity_type: 'organization', entity_id: payload.organizationId })
      return Response.json({ ok: true, status })
    }

    if (payload.action === 'invite_member') {
      const email = payload.email?.trim().toLowerCase()
      const fullName = payload.fullName?.trim()
      if (!email || !fullName || !payload.role || !payload.redirectTo) return fail('Name, email, role and redirect URL are required')
      const { data: existing } = await ctx.supabaseAdmin.from('profiles').select('id,status').ilike('email', email).maybeSingle()
      let userId = existing?.id as string | undefined
      if (!userId) {
        const { data, error } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo: payload.redirectTo })
        if (error || !data.user) return fail('Invitation could not be sent. Check Auth email/SMTP configuration.', 502)
        userId = data.user.id
      }
      const { error } = await ctx.supabaseAdmin.from('organization_members').upsert({ organization_id: payload.organizationId, user_id: userId, role: payload.role, status: existing?.status === 'active' ? 'active' : 'invited', invited_by: callerId }, { onConflict: 'organization_id,user_id' })
      if (error) return fail('Team membership could not be created', 500)
      await ctx.supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('id', userId)
      await ctx.supabaseAdmin.from('activity_logs').insert({ organization_id: payload.organizationId, actor_user_id: callerId, event_type: 'user_invited', entity_type: 'profile', entity_id: userId, metadata: { role: payload.role } })
      return Response.json({ ok: true, userId })
    }

    let targetUserId = payload.targetUserId
    let targetEmail = payload.email?.trim().toLowerCase()
    if (targetUserId) {
      const { data } = await ctx.supabaseAdmin.from('profiles').select('email').eq('id', targetUserId).single()
      targetEmail = data?.email
    }
    if (!targetEmail) return fail('A target user or email is required')

    if (payload.action === 'resend_invitation') {
      const { error } = await ctx.supabaseAdmin.auth.resend({ type: 'signup', email: targetEmail, options: { emailRedirectTo: payload.redirectTo } })
      if (error) return fail('Invitation could not be resent', 502)
    } else if (payload.action === 'send_password_reset') {
      const { error } = await ctx.supabaseAdmin.auth.resetPasswordForEmail(targetEmail, { redirectTo: payload.redirectTo })
      if (error) return fail('Password reset could not be sent', 502)
    } else if (payload.action === 'disable_user' || payload.action === 'enable_user') {
      if (!targetUserId) return fail('A target user ID is required')
      const { data: targetMembership } = await ctx.supabaseAdmin.from('organization_members').select('role').eq('organization_id', payload.organizationId).eq('user_id', targetUserId).single()
      if (!isAdmin && targetMembership?.role === 'owner') return fail('Managers cannot disable an owner', 403)
      const disabled = payload.action === 'disable_user'
      const { error } = await ctx.supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: disabled ? '876000h' : 'none' })
      if (error) return fail('User access could not be updated', 500)
      await Promise.all([
        ctx.supabaseAdmin.from('profiles').update({ status: disabled ? 'disabled' : 'active' }).eq('id', targetUserId),
        ctx.supabaseAdmin.from('organization_members').update({ status: disabled ? 'disabled' : 'active' }).eq('organization_id', payload.organizationId).eq('user_id', targetUserId),
      ])
    } else {
      return fail('Unsupported access action')
    }

    await ctx.supabaseAdmin.from('activity_logs').insert({ organization_id: payload.organizationId, actor_user_id: callerId, event_type: payload.action, entity_type: 'profile', entity_id: targetUserId ?? null })
    return Response.json({ ok: true })
  }),
}
