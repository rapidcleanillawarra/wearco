import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
    const { id } = params;

    if (!id) {
        throw error(400, 'Template ID is required');
    }

    try {
        const { data: template, error: templateError } = await locals.supabase
            .from('wearco_templates')
            .select('id, template_name, category, template_data')
            .eq('id', id)
            .single();

        if (templateError) {
            console.error('Error fetching template:', templateError);
            throw error(404, 'Template not found');
        }

        if (!template) {
            throw error(404, 'Template not found');
        }

        return json(template);
    } catch (err) {
        console.error('Error in template API:', err);
        throw error(500, 'Internal server error');
    }
};