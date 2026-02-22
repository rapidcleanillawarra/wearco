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
    targetField?: string; // Maps to a DrawingFormData field name (e.g., "job_number", "customer", etc.)
    targetFieldf?: string; // Legacy typo - supported for backwards compatibility
    fontSize?: number;
    rotation?: number;
    options?: Array<{
        label: string;
        value: string;
        position: TemplateFieldPosition;
    }>;
    position: TemplateFieldPosition;
    /** Section for mobile grouping, e.g. "center-edge#1" → title "center-edge", order 1 */
    sections?: string;
}

/**
 * Structure of template_data JSONB column
 */
export interface TemplateData {
    fields: TemplateField[];
    pageWidth: number;
    pageHeight: number;
}
