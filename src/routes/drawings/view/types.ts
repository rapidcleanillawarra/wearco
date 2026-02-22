import type { WearcoTemplate, WearcoDrawing } from '$lib/types/template';
import type { WearcoDiagram } from '$lib/types/svg_diagram';

export interface ViewPageData {
    drawing: WearcoDrawing;
    template: WearcoTemplate;
    diagrams: WearcoDiagram[];
    pdfUrl: string | undefined;
}

export interface TemplateFieldPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TemplateField {
    id: string;
    type: string;
    label: string;
    textPosition?: string;
    targetField?: string;
    targetFieldf?: string;
    fontSize?: number;
    rotation?: number;
    options?: Array<{
        label: string;
        value: string;
        position: TemplateFieldPosition;
    }>;
    position: TemplateFieldPosition;
    sections?: string;
}

export interface TemplateData {
    fields: TemplateField[];
    pageWidth: number;
    pageHeight: number;
}
