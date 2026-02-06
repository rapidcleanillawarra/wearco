import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const { data: templates, error } = await locals.supabase
        .from('wearco_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return { templates: [], error: 'Failed to load templates' };
    }

    return {
        templates: templates || []
    };
};

export const actions: Actions = {
    saveTemplate: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        const imageDisplay = formData.get('imageDisplay') as string;

        if (!name) {
            return fail(400, { missing: true, message: 'Template name is required' });
        }

        const templateData = {
            template_name: name,
            category: category || null,
            description: description || null,
            image_display: imageDisplay || null,
            updated_at: new Date().toISOString()
        };

        let error;

        if (id) {
            // Update existing
            const { error: updateError } = await locals.supabase
                .from('wearco_templates')
                .update(templateData)
                .eq('id', id);
            error = updateError;
        } else {
            // Create new - Initialize with basic structure
            const { error: insertError } = await locals.supabase
                .from('wearco_templates')
                .insert({
                    ...templateData,
                    template_data: { drawings: [] }, // Default empty structure
                    created_at: new Date().toISOString()
                });
            error = insertError;
        }

        if (error) {
            console.error('Error saving template:', error);
            return fail(500, { supabase: true, message: 'Failed to save template' });
        }

        return { success: true };
    },

    deleteTemplate: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { missing: true, message: 'Template ID is required' });
        }

        const { error } = await locals.supabase
            .from('wearco_templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting template:', error);
            return fail(500, { supabase: true, message: 'Failed to delete template' });
        }

        return { success: true };
    }
};
