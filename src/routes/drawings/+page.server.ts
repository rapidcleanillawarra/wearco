import type { PageServerLoad } from './$types'
import type { WearcoDrawing } from '$lib/types/template'

export const load: PageServerLoad = async ({ locals }) => {
  const { data: drawings, error } = await locals.supabase
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