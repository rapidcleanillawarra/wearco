export interface WearcoTemplate {
  id: string
  template_name: string
  category: string | null
  template_data: Record<string, any> | null
  created_by: string | null
  created_at: string
  updated_at: string
  visual_document: string | null
  image_display: string | null
  description: string | null
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
  purchase_order: string | null
  checked_by: string | null
  prog_by: string | null
  drawing_data: Record<string, any> | null
  updated_by: string | null
  updated_by_name: string | null
  deleted_by: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}