import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
    const templateId = url.searchParams.get('template_id');

    if (!templateId) {
        throw error(400, 'Template ID is required');
    }

    // Fetch the template
    const { data: template, error: templateErr } = await locals.supabase
        .from('wearco_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (templateErr) {
        console.error('Error fetching template:', templateErr);
        throw error(500, 'Error fetching template configuration');
    }

    if (!template) {
        throw error(404, 'Template not found');
    }

    // Generate PDF URL from storage if visual_document is set
    let pdfUrl: string | undefined = undefined;
    if (template.visual_document) {
        console.log('Generating signed URL for:', `templates/${template.visual_document}`);
        const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
            .from('wearco')
            .createSignedUrl(`templates/${template.visual_document}`, 3600); // 1 hour expiry

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
        } else if (signedUrlData) {
            pdfUrl = signedUrlData.signedUrl;
            console.log('Generated signed URL:', pdfUrl);
        }
    } else {
        console.log('No visual_document set for template');
    }

    return {
        template,
        pdfUrl
    };
};