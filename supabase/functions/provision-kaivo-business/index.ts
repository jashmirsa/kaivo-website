import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

type ProvisionRequest = {
  business: {
    name: string
    businessType: string
    industry?: string
    website?: string
    phone?: string
    email?: string
    city?: string
    province?: string
    country?: string
    primaryColor?: string
    secondaryColor?: string
    brandDescription?: string
  }
  owner: { fullName: string; email: string; phone?: string }
  redirectTo: string
}

const allowedRedirect = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  } catch {
    return false
  }
}

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 54)

const fail = (message: string, status = 400) => Response.json({ error: message }, { status })

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return fail('Method not allowed', 405)

    const callerId = ctx.userClaims?.sub
    if (!callerId) return fail('Authentication required', 401)

    const { data: caller, error: callerError } = await ctx.supabaseAdmin
      .from('profiles')
      .select('platform_role,status')
      .eq('id', callerId)
      .single()

    if (callerError || caller?.status !== 'active' || !['super_admin', 'kaivo_admin'].includes(caller.platform_role ?? '')) {
      return fail('You are not authorized to provision businesses', 403)
    }

    let payload: ProvisionRequest
    try {
      payload = await req.json()
    } catch {
      return fail('Invalid JSON body')
    }

    const businessName = payload.business?.name?.trim()
    const ownerName = payload.owner?.fullName?.trim()
    const ownerEmail = payload.owner?.email?.trim().toLowerCase()
    if (!businessName || businessName.length > 160 || !ownerName || ownerName.length > 120) return fail('Business and owner names are required')
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return fail('A valid owner email is required')
    if (!allowedRedirect(payload.redirectTo)) return fail('Invalid invitation redirect URL')

    const colors = [payload.business.primaryColor ?? '#5B5CE2', payload.business.secondaryColor ?? '#0A0B0D']
    if (colors.some((color) => !/^#[0-9A-Fa-f]{6}$/.test(color))) return fail('Brand colours must use six-digit hex values')

    const { data: existingProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('id,status')
      .ilike('email', ownerEmail)
      .maybeSingle()

    let ownerId = existingProfile?.id as string | undefined
    let invitationSent = false

    if (!ownerId) {
      const { data: invited, error: inviteError } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(ownerEmail, {
        data: { full_name: ownerName },
        redirectTo: payload.redirectTo,
      })
      if (inviteError || !invited.user) return fail('The secure invitation could not be sent. Check Auth email/SMTP configuration.', 502)
      ownerId = invited.user.id
      invitationSent = true
    }

    const baseSlug = slugify(businessName) || 'business'
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
    const { data: organization, error: orgError } = await ctx.supabaseAdmin
      .from('organizations')
      .insert({
        name: businessName,
        slug,
        business_type: payload.business.businessType?.trim() ?? '',
        industry: payload.business.industry?.trim() ?? '',
        website: payload.business.website?.trim() || null,
        phone: payload.business.phone?.trim() || null,
        email: payload.business.email?.trim().toLowerCase() || null,
        city: payload.business.city?.trim() || null,
        province: payload.business.province?.trim() || null,
        country: payload.business.country?.trim() || 'South Africa',
        brand_primary_color: colors[0],
        brand_secondary_color: colors[1],
        brand_description: payload.business.brandDescription?.trim() ?? '',
        created_by: callerId,
      })
      .select('id,name,slug,status')
      .single()

    if (orgError || !organization) {
      if (invitationSent && ownerId) await ctx.supabaseAdmin.auth.admin.deleteUser(ownerId)
      return fail('Business provisioning failed before the workspace was created', 500)
    }

    const rollback = async () => {
      await ctx.supabaseAdmin.from('organizations').delete().eq('id', organization.id)
      if (invitationSent && ownerId) await ctx.supabaseAdmin.auth.admin.deleteUser(ownerId)
    }

    const membershipStatus = existingProfile?.status === 'active' ? 'active' : 'invited'
    const { error: membershipError } = await ctx.supabaseAdmin.from('organization_members').insert({
      organization_id: organization.id,
      user_id: ownerId,
      role: 'owner',
      status: membershipStatus,
      joined_at: membershipStatus === 'active' ? new Date().toISOString() : null,
      invited_by: callerId,
    })
    if (membershipError) {
      await rollback()
      return fail('Business provisioning failed while assigning the owner', 500)
    }

    const setupResults = await Promise.all([
      ctx.supabaseAdmin.from('profiles').update({ full_name: ownerName, phone: payload.owner.phone?.trim() || null }).eq('id', ownerId),
      ctx.supabaseAdmin.from('organization_settings').insert({ organization_id: organization.id }),
      ctx.supabaseAdmin.from('brand_guidelines').insert({ organization_id: organization.id, brand_description: payload.business.brandDescription?.trim() ?? '' }),
      ctx.supabaseAdmin.from('social_accounts').insert(['instagram', 'facebook', 'tiktok'].map((provider) => ({ organization_id: organization.id, provider }))),
    ])

    if (setupResults.some((result) => result.error)) {
      await rollback()
      return fail('Business provisioning failed while initializing the workspace', 500)
    }

    await ctx.supabaseAdmin.from('activity_logs').insert({
      organization_id: organization.id,
      actor_user_id: callerId,
      event_type: 'business_created',
      entity_type: 'organization',
      entity_id: organization.id,
      metadata: { owner_id: ownerId, invitation_sent: invitationSent },
    })

    return Response.json({ organization, ownerId, invitationSent }, { status: 201 })
  }),
}
