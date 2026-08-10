import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Membership, Organization, Profile } from '../types/database'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'configuration_error' | 'error'
export type SignInResult = { destination: '/admin' | '/dashboard'; error?: never } | { error: string; destination?: never }

export type AuthContextValue = {
  state: AuthState
  session: Session | null
  user: User | null
  profile: Profile | null
  memberships: Membership[]
  activeOrganization: Organization | null
  activeMembership: Membership | null
  error: string | null
  isPlatformAdmin: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  selectOrganization: (organizationId: string) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
