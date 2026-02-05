import type { PageServerLoad } from './$types'
import { getSupabaseClient } from '$lib/supabase.server'
import type { WearcoDrawing } from '$lib/types/template'

export const load: PageServerLoad = async () => {
  const supabase = getSupabaseClient()

  const { data: drawings, error } = await supabase
    .from('wearco_drawings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching drawings:', error)
    return {
      drawings: [] as WearcoDrawing[],
      error: error.message
    }
  }

  return {
    drawings: drawings as WearcoDrawing[]
  }
}