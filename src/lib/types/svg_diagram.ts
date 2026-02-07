import type { WearcoTemplate } from './template';

export interface WearcoDiagram {
    id: string;
    template_id: string;
    name: string;
    type: string | null;
    dimension: Record<string, any> | null;
    variables: Record<string, any>;
    file: string | null;
    created_at: string;
    updated_at: string;
}

// Backward compatibility alias
export type WearcoSvgDiagram = WearcoDiagram;

export interface DiagramPageData {
    mode: 'create' | 'edit';
    diagram: WearcoDiagram | null;
    template: WearcoTemplate | null;
    templates: WearcoTemplate[];
    selectedTemplateId: string | null;
}
