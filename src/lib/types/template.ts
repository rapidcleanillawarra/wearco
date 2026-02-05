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

export interface WearcoDrawing {
  id: string
  template_id: string | null
  job_number: string | null
  work_order: string | null
  drawing_number: string | null
  name: string | null
  customer: string | null
  customer_source: string | null
  quantity: number | null
  dl: string | null
  checked_by: string | null
  prog_by: string | null
  material: string | null
  thk: string | null
  additional_data: Record<string, any>
  updated_by: string | null
  deleted_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}