import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    const id = url.searchParams.get('id');
    const templateId = url.searchParams.get('template_id');

    // Fetch available templates for the dropdown
    const { data: templates, error: templatesError } = await locals.supabase
        .from('wearco_templates')
        .select('id, template_name, category, template_data')
        .order('template_name');

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        return fail(500, { error: 'Failed to load templates' });
    }

    console.log('Fetched template data for searchable dropdown:', templates);

    let diagram = null;
    let mode: 'create' | 'edit' = 'create';

    if (id) {
        // Fetch the diagram for editing from wearco_diagrams table
        const { data: diagramData, error: diagramError } = await locals.supabase
            .from('wearco_diagrams')
            .select('id, template_id, type')
            .eq('id', id)
            .single();

        if (diagramError) {
            console.error('Error fetching diagram:', diagramError);
            return fail(404, { error: 'Diagram not found' });
        }

        diagram = diagramData;
        mode = 'edit';
    } else {
        // Redirect to diagrams list if no id parameter
        throw new Response(null, {
            status: 302,
            headers: { Location: '/diagrams' }
        });
    }

    return {
        templates: templates || [],
        diagram,
        mode,
        selectedTemplateId: templateId
    };
};

export const actions: Actions = {
    saveDiagram: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const templateId = formData.get('template_id') as string;
        const type = formData.get('type') as string;
        const dimensionJson = formData.get('dimension') as string;
        const variablesJson = formData.get('variables') as string;

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
        let diagramVariables;
        let diagramDimension;
        try {
            diagramVariables = variablesJson ? JSON.parse(variablesJson) : {};
        } catch (e) {
            return fail(400, { invalid: true, message: 'Invalid JSON variables format' });
        }

        try {
            diagramDimension = dimensionJson ? JSON.parse(dimensionJson) : null;
        } catch (e) {
            return fail(400, { invalid: true, message: 'Invalid JSON dimension format' });
        }

        const diagramPayload = {
            name,
            template_id: templateId,
            type: type || null,
            dimension: diagramDimension,
            variables: diagramVariables,
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