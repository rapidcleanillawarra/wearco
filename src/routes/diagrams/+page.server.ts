import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Fetch diagrams with their associated template information
    const { data: diagrams, error: diagramsError } = await locals.supabase
        .from('wearco_svg_diagrams')
        .select(`
            *,
            wearco_templates (
                template_name,
                category
            )
        `)
        .order('updated_at', { ascending: false });

    // Fetch available templates for the create modal dropdown
    const { data: templates, error: templatesError } = await locals.supabase
        .from('wearco_templates')
        .select('id, template_name, category')
        .order('template_name');

    if (diagramsError) {
        console.error('Error fetching diagrams:', diagramsError);
        return { diagrams: [], templates: [], error: 'Failed to load diagrams' };
    }

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        return { diagrams: diagrams || [], templates: [], error: 'Failed to load templates' };
    }

    return {
        diagrams: diagrams || [],
        templates: templates || []
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

        if (id) {
            // Update existing diagram
            const { error: updateError } = await locals.supabase
                .from('wearco_svg_diagrams')
                .update(diagramPayload)
                .eq('id', id);
            error = updateError;
        } else {
            // Create new diagram
            const { error: insertError } = await locals.supabase
                .from('wearco_svg_diagrams')
                .insert({
                    ...diagramPayload,
                    created_at: new Date().toISOString()
                });
            error = insertError;
        }

        if (error) {
            console.error('Error saving diagram:', error);
            return fail(500, { supabase: true, message: 'Failed to save diagram' });
        }

        return { success: true };
    },

    deleteDiagram: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { missing: true, message: 'Diagram ID is required' });
        }

        const { error } = await locals.supabase
            .from('wearco_svg_diagrams')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting diagram:', error);
            return fail(500, { supabase: true, message: 'Failed to delete diagram' });
        }

        return { success: true };
    }
};