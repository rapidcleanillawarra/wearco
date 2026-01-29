import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/private'

export function getSupabaseClient() {
  return createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)
}