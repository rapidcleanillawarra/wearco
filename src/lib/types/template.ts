export interface WearcoTemplate {
  id: string
  template_name: string
  template_code: string | null
  customer: string | null
  category: string
  dimension_schema: Record<string, any>
  template_data: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
}