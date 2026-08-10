import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  publishableKey: string
  enabled: boolean
}

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || ''
).trim()

export const supabaseConfig: SupabaseConfig = {
  url,
  publishableKey,
  enabled: Boolean(url && publishableKey),
}

export const supabase: SupabaseClient | null = supabaseConfig.enabled
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('KAIVO is not connected to Supabase. Configure the public Vite environment variables.')
  }
  return supabase
}

export function getSupabaseStatusMessage(): string {
  return supabaseConfig.enabled
    ? 'KAIVO is connected to Supabase Auth and the Data API.'
    : 'Supabase is not configured. Add the KAIVO project URL and publishable key to .env.local.'
}
