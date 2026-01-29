import type { PageLoad } from './$types'
import { getSupabaseClient } from '$lib/supabase.server'
import type { WearcoTemplate } from '$lib/types/template'

export const load: PageLoad = async () => {
  const supabase = getSupabaseClient()

  const { data: templates, error } = await supabase
    .from('wearco_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    return {
      templates: [] as WearcoTemplate[],
      error: error.message
    }
  }

  return {
    templates: templates as WearcoTemplate[]
  }
}