import type { PageServerLoad } from './$types'
import type { WearcoDrawing, WearcoTemplate } from '$lib/types/template'

export const load: PageServerLoad = async ({ locals }) => {
  const { data: drawings, error } = await locals.supabase
    .from('wearco_drawings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: templates, error: templateError } = await locals.supabase
    .from('wearco_templates')
    .select('*')
    .order('template_name', { ascending: true })

  if (error) {
    console.error('Error fetching drawings:', error)
    return {
      drawings: [] as WearcoDrawing[],
      templates: templates as WearcoTemplate[] || [],
      error: error.message
    }
  }

  if (templateError) {
    console.error('Error fetching templates:', templateError)
  }

  return {
    drawings: drawings as WearcoDrawing[],
    templates: templates as WearcoTemplate[] || []
  }
}