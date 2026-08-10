import type { Session, User } from '@supabase/supabase-js'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfig } from '../lib/supabase'
import type { Membership, Organization, Profile } from '../types/database'
import { AuthContext, type AuthContextValue, type AuthState, type SignInResult } from './AuthContext'

async function resolveContext(user: User) {
  if (!supabase) throw new Error('Supabase is not configured')
  const [{ data: profile, error: profileError }, { data: membershipRows, error: membershipError }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,avatar_url,phone,platform_role,status,last_active_at').eq('id', user.id).single(),
    supabase
      .from('organization_members')
      .select('id,organization_id,user_id,role,status,organizations!inner(id,name,slug,business_type,industry,logo_url,brand_primary_color,brand_secondary_color,brand_description,website,email,phone,city,country,status,subscription_status,created_at)')
      .eq('user_id', user.id)
      .in('status', ['active', 'invited']),
  ])
  if (profileError) throw new Error('Your KAIVO profile could not be resolved. Contact KAIVO support.')
  if (membershipError) throw new Error('Your business access could not be resolved. Contact KAIVO support.')

  const memberships: Membership[] = (membershipRows ?? []).map((row) => ({
    id: row.id as string,
    organization_id: row.organization_id as string,
    user_id: row.user_id as string,
    role: row.role as Membership['role'],
    status: row.status as Membership['status'],
    organization: row.organizations as unknown as Organization,
  }))

  return { profile: profile as Profile, memberships }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(supabaseConfig.enabled ? 'loading' : 'configuration_error')
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)
    if (!nextSession?.user) {
      setProfile(null)
      setMemberships([])
      setActiveOrganizationId(null)
      setState('unauthenticated')
      return
    }
    setState('loading')
    try {
      const context = await resolveContext(nextSession.user)
      if (!['active', 'invited'].includes(context.profile.status)) {
        await supabase?.auth.signOut()
        throw new Error('This KAIVO account is disabled. Contact KAIVO support.')
      }
      setProfile(context.profile)
      setMemberships(context.memberships)
      setActiveOrganizationId((current) => context.memberships.some((item) => item.organization_id === current) ? current : context.memberships[0]?.organization_id ?? null)
      setError(null)
      setState('authenticated')
      void supabase?.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', nextSession.user.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'KAIVO could not load your account.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError('KAIVO could not restore your secure session.')
        setState('error')
      } else {
        void applySession(data.session)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => { if (active) void applySession(nextSession) }, 0)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [applySession])

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    if (!supabase) return { error: 'KAIVO authentication is not configured.' }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (signInError || !data.user || !data.session) return { error: 'Unable to sign in with those credentials.' }
    try {
      const context = await resolveContext(data.user)
      if (!['active', 'invited'].includes(context.profile.status)) {
        await supabase.auth.signOut()
        return { error: 'This KAIVO account is not active. Contact KAIVO support.' }
      }
      await applySession(data.session)
      const isAdmin = ['super_admin', 'kaivo_admin'].includes(context.profile.platform_role ?? '')
      if (!isAdmin && context.memberships.length === 0) {
        await supabase.auth.signOut()
        return { error: 'No active KAIVO business is assigned to this account.' }
      }
      return { destination: isAdmin ? '/admin' : '/dashboard' }
    } catch {
      await supabase.auth.signOut()
      return { error: 'Your KAIVO access could not be verified.' }
    }
  }, [applySession])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    setSession(null)
    setProfile(null)
    setMemberships([])
    setState('unauthenticated')
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } }
    await applySession(data.session)
  }, [applySession])

  const activeMembership = memberships.find((item) => item.organization_id === activeOrganizationId) ?? null
  const value = useMemo<AuthContextValue>(() => ({
    state,
    session,
    user: session?.user ?? null,
    profile,
    memberships,
    activeOrganization: activeMembership?.organization ?? null,
    activeMembership,
    error,
    isPlatformAdmin: ['super_admin', 'kaivo_admin'].includes(profile?.platform_role ?? ''),
    signIn,
    signOut,
    refresh,
    selectOrganization: setActiveOrganizationId,
  }), [state, session, profile, memberships, activeMembership, error, signIn, signOut, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
