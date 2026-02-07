import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    const id = url.searchParams.get('id')?.trim() ?? '';
    const templateIdParam = url.searchParams.get('template_id')?.trim() ?? '';
    const typeParam = url.searchParams.get('type')?.trim() ?? '';

    // Mode detection: edit = only id (no template_id or type); create = both template_id and type; else invalid
    const hasId = id.length > 0;
    const hasOnlyId = hasId && !templateIdParam && !typeParam;
    const hasTemplateIdAndType = templateIdParam.length > 0 && typeParam.length > 0;

    if (hasOnlyId) {
        // Edit mode: URL has only id parameter
        const { data: templates, error: templatesError } = await locals.supabase
            .from('wearco_templates')
            .select('id, template_name, category, template_data')
            .order('template_name');

        if (templatesError) {
            console.error('Error fetching templates:', templatesError);
            return fail(500, { error: 'Failed to load templates' });
        }

        const { data: diagramData, error: diagramError } = await locals.supabase
            .from('wearco_diagrams')
            .select('id, name, template_id, type, dimension, variables')
            .eq('id', id)
            .single();

        // Parse variables for easier client-side handling
        let parsedVariables = {};
        if (diagramData?.variables) {
            try {
                parsedVariables = typeof diagramData.variables === 'string'
                    ? JSON.parse(diagramData.variables)
                    : diagramData.variables;
            } catch (e) {
                console.error('Error parsing diagram variables:', e);
                parsedVariables = {};
            }
        }

        if (diagramError) {
            console.error('Error fetching diagram:', diagramError);
            return fail(404, { error: 'Diagram not found' });
        }

        // Fetch associated template if template_id exists
        let template = null;
        if (diagramData?.template_id) {
            const { data: templateData, error: templateError } = await locals.supabase
                .from('wearco_templates')
                .select('*')
                .eq('id', diagramData.template_id)
                .single();

            if (!templateError && templateData) {
                template = templateData;
            }
        }

        return {
            templates: templates || [],
            diagram: diagramData,
            template: template,
            mode: 'edit' as const,
            selectedTemplateId: diagramData?.template_id ?? templateIdParam,
            variables: parsedVariables
        };
    }

    if (hasTemplateIdAndType) {
        // Create mode: URL has both template_id and type
        const { data: templates, error: templatesError } = await locals.supabase
            .from('wearco_templates')
            .select('id, template_name, category, template_data')
            .order('template_name');

        if (templatesError) {
            console.error('Error fetching templates:', templatesError);
            return fail(500, { error: 'Failed to load templates' });
        }

        return {
            templates: templates || [],
            diagram: null,
            template: null,
            mode: 'create' as const,
            selectedTemplateId: templateIdParam
        };
    }

    // Invalid: neither edit (id only) nor create (template_id + type)
    throw redirect(302, '/diagrams');
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
        let diagramDimension;
        let diagramVariables;
        try {
            diagramDimension = dimensionJson ? JSON.parse(dimensionJson) : null;
            diagramVariables = variablesJson ? JSON.parse(variablesJson) : null;
        } catch (e) {
            return fail(400, { invalid: true, message: 'Invalid JSON format' });
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
                .from('wearco_diagrams')
                .update(diagramPayload)
                .eq('id', id);
            error = updateError;
        } else {
            // Create new diagram
            const { data: newDiagram, error: insertError } = await locals.supabase
                .from('wearco_diagrams')
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