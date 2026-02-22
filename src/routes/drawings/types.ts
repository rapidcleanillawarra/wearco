import type { WearcoTemplate, WearcoDrawing } from '$lib/types/template';
import type { WearcoDiagram } from '$lib/types/svg_diagram';

export type DrawingView = {
  id: string
  title: string
  workOrder: string
  jobNumber: string
  customer: string
  drawingNumber: string
  progBy: string
  checkedBy: string
  updatedLabel: string
  quantity: number
  /** Template image_display URL for card/row thumbnail */
  imageDisplay: string | null
}

export interface DrawingFormData {
  job_number: string;
  work_order: string;
  drawing_number: string;
  name: string;
  customer: string;
  customer_source: string;
  quantity: number;
  dl: string;
  checked_by: string;
  prog_by: string;
  purchase_order: string;
  drawing_data: Record<string, any>;
}

export interface DrawingPageData {
  mode: 'new' | 'edit';
  template: WearcoTemplate;
  drawing: WearcoDrawing | null;
  diagrams: WearcoDiagram[];
  pdfUrl: string | undefined;
}
