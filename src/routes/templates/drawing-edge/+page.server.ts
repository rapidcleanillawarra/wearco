import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const { data: template, error: err } = await locals.supabase
        .from('wearco_templates')
        .select('*')
        .eq('category', 'Edge')
        .eq('template_name', 'Edge Template')
        .single();

    if (err) {
        console.error('Error fetching template:', err);
        throw error(500, 'Error fetching template configuration');
    }

    if (!template) {
        throw error(404, 'Template not found');
    }

    return {
        template
    };
};
