import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
    const id = url.searchParams.get('id');

    let template = null;

    if (id) {
        const { data, error } = await locals.supabase
            .from('wearco_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching template:', error);
        } else {
            template = data;
        }
    }

    let signedVisualDocumentUrl = null;
    if (template?.visual_document) {
        let storagePath = template.visual_document;
        // Ensure path includes templates/ prefix if not already present
        if (!storagePath.startsWith('templates/')) {
            storagePath = `templates/${storagePath}`;
        }

        console.log('Generating signed URL for:', storagePath);
        const { data: signedData, error: signedError } = await locals.supabase
            .storage
            .from('wearco')
            .createSignedUrl(storagePath, 3600); // 1 hour expiry

        if (signedError) {
            console.error('Error creating signed URL:', signedError);
            // Try fallback to root path just in case
            if (storagePath.startsWith('templates/')) {
                console.log('Retrying with root path...');
                const { data: retryData, error: retryError } = await locals.supabase
                    .storage
                    .from('wearco')
                    .createSignedUrl(template.visual_document, 3600);

                if (!retryError) {
                    signedVisualDocumentUrl = retryData?.signedUrl;
                }
            }
        } else {
            console.log('Signed URL generated successfully');
            signedVisualDocumentUrl = signedData?.signedUrl;
        }
    } else {
        console.log('No visual_document found in template or template is null');
    }

    return {
        template,
        signedVisualDocumentUrl,
        mode: id ? 'edit' : 'create'
    };
};

export const actions: Actions = {
    save: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('template_name') as string;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        const visual_document = formData.get('visual_document') as string;
        const image_display = formData.get('image_display') as string;
        const template_data_str = formData.get('template_data') as string;

        if (!name) {
            return fail(400, { missing: true, message: 'Template name is required' });
        }

        let template_data = {};
        try {
            template_data = JSON.parse(template_data_str || '{}');
        } catch (e) {
            return fail(400, { invalid: true, message: 'Invalid template data JSON' });
        }

        const dataToSave = {
            template_name: name,
            category: category || 'Edge',
            description: description || null,
            visual_document: visual_document || null,
            image_display: image_display || null,
            template_data: template_data,
            updated_at: new Date().toISOString()
        };

        let resultId = id;
        let error;

        if (id) {
            // Update
            const { error: updateError } = await locals.supabase
                .from('wearco_templates')
                .update(dataToSave)
                .eq('id', id);
            error = updateError;
        } else {
            // Create
            const { data: insertedData, error: insertError } = await locals.supabase
                .from('wearco_templates')
                .insert({
                    ...dataToSave,
                    created_by: (await locals.supabase.auth.getUser()).data.user?.email
                })
                .select('id')
                .single();

            if (insertedData) {
                resultId = insertedData.id;
            }
            error = insertError;
        }

        if (error) {
            console.error('Error saving template:', error);
            return fail(500, { supabase: true, message: 'Failed to save template' });
        }

        throw redirect(303, `/templates/manage?id=${resultId}`);
    }
};
