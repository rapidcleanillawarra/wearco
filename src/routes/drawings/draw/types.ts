/**
 * Position coordinates for template fields
 */
export interface TemplateFieldPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Individual field definition from template_data
 */
export interface TemplateField {
    id: string;
    type: string;
    label: string;
    textPosition?: string;
    targetFieldf?: string;
    fontSize?: number;
    position: TemplateFieldPosition;
    targetField?: string; // Maps to a DrawingFormData field name (e.g., "job_number", "customer", etc.)
}

/**
 * Structure of template_data JSONB column
 */
export interface TemplateData {
    fields: TemplateField[];
    pageWidth: number;
    pageHeight: number;
}
