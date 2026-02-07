import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    const id = url.searchParams.get('id');

    // Fetch available templates for the dropdown
    const { data: templates, error: templatesError } = await locals.supabase
        .from('wearco_templates')
        .select('id, template_name, category')
        .order('template_name');

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        return fail(500, { error: 'Failed to load templates' });
    }

    let diagram = null;
    let mode: 'create' | 'edit' = 'create';

    if (id) {
        // Fetch the diagram for editing
        const { data: diagramData, error: diagramError } = await locals.supabase
            .from('wearco_svg_diagrams')
            .select('*')
            .eq('id', id)
            .single();

        if (diagramError) {
            console.error('Error fetching diagram:', diagramError);
            return fail(404, { error: 'Diagram not found' });
        }

        diagram = diagramData;
        mode = 'edit';
    }

    return {
        templates: templates || [],
        diagram,
        mode
    };
};

export const actions: Actions = {
    saveDiagram: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const templateId = formData.get('template_id') as string;
        const dataJson = formData.get('data') as string;

        if (!name) {
            return fail(400, { missing: true, message: 'Diagram name is required' });
        }

        if (!templateId) {
            return fail(400, { missing: true, message: 'Template selection is required' });
        }

        // Validate that the template exists
        const { data: template, error: templateError } = await locals.supabase
            .from('wearco_templates')
            .select('id')
            .eq('id', templateId)
            .single();

        if (templateError || !template) {
            return fail(400, { invalid: true, message: 'Selected template does not exist' });
        }

        // Parse and validate JSON data
        let diagramData;
        try {
            diagramData = dataJson ? JSON.parse(dataJson) : {};
        } catch (e) {
            return fail(400, { invalid: true, message: 'Invalid JSON data format' });
        }

        const diagramPayload = {
            name,
            template_id: templateId,
            data: diagramData,
            updated_at: new Date().toISOString()
        };

        let error;
        let resultId = id;

        if (id) {
            // Update existing diagram
            const { error: updateError } = await locals.supabase
                .from('wearco_svg_diagrams')
                .update(diagramPayload)
                .eq('id', id);
            error = updateError;
        } else {
            // Create new diagram
            const { data: newDiagram, error: insertError } = await locals.supabase
                .from('wearco_svg_diagrams')
                .insert({
                    ...diagramPayload,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            error = insertError;
            if (newDiagram) {
                resultId = newDiagram.id;
            }
        }

        if (error) {
            console.error('Error saving diagram:', error);
            return fail(500, { supabase: true, message: 'Failed to save diagram' });
        }

        return {
            success: true,
            message: id ? 'Diagram updated successfully' : 'Diagram created successfully',
            id: resultId
        };
    }
};