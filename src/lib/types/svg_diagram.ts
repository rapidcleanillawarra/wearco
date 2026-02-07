export interface WearcoSvgDiagram {
    id: string;
    template_id: string;
    name: string;
    type: string | null;
    dimension: Record<string, any> | null;
    variables: Record<string, any>;
    created_at: string;
    updated_at: string;
}
