import type { Actions, PageServerLoad } from './$types'
import type { WearcoDrawing, WearcoTemplate } from '$lib/types/template'

export const load: PageServerLoad = async ({ locals }) => {
  const { data: drawings, error } = await locals.supabase
    .from('drawings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: templates, error: templateError } = await locals.supabase
    .from('templates')
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

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const drawingId = formData.get('drawing_id') as string | null
    if (!drawingId) {
      return { success: false, error: 'Missing drawing ID' }
    }

    const { data: { user } } = await locals.supabase.auth.getUser()
    const deletedByName =
      (user?.user_metadata?.display_name as string)?.trim() ||
      user?.email ||
      null

    const now = new Date().toISOString()
    const { error } = await locals.supabase
      .from('drawings')
      .update({
        deleted_at: now,
        deleted_by: user?.email ?? null,
        deleted_by_name: deletedByName
      })
      .eq('id', drawingId)

    if (error) {
      console.error('Error soft-deleting drawing:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  }
}