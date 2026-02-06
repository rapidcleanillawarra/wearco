import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { DrawingPageData } from '../types';

export const load: PageServerLoad = async ({ locals, url }): Promise<DrawingPageData> => {
    const templateId = url.searchParams.get('template_id');
    const drawingId = url.searchParams.get('id');

    // Determine operation mode: id takes precedence over template_id
    let mode: 'new' | 'edit';
    let targetId: string;

    if (drawingId) {
        mode = 'edit';
        targetId = drawingId;
    } else if (templateId) {
        mode = 'new';
        targetId = templateId;
    } else {
        // No parameters provided - redirect to drawings list
        throw redirect(302, '/drawings');
    }

    try {
        let template;
        let drawing = null;
        let pdfUrl: string | undefined;

        if (mode === 'edit') {
            // EDIT mode: fetch drawing first, then template
            const { data: drawingData, error: drawingErr } = await locals.supabase
                .from('wearco_drawings')
                .select('*')
                .eq('id', targetId)
                .single();

            if (drawingErr || !drawingData) {
                throw redirect(302, '/drawings');
            }

            drawing = drawingData;

            // Check if template_id exists on the drawing
            if (!drawing.template_id) {
                throw redirect(302, '/drawings');
            }

            // Fetch the associated template
            const { data: templateData, error: templateErr } = await locals.supabase
                .from('wearco_templates')
                .select('*')
                .eq('id', drawing.template_id)
                .single();

            if (templateErr || !templateData) {
                throw redirect(302, '/drawings');
            }

            template = templateData;
        } else {
            // NEW mode: fetch template directly
            const { data: templateData, error: templateErr } = await locals.supabase
                .from('wearco_templates')
                .select('*')
                .eq('id', targetId)
                .single();

            if (templateErr || !templateData) {
                throw redirect(302, '/drawings');
            }

            template = templateData;
        }

        // Generate PDF URL from storage if visual_document is set
        if (template.visual_document) {
            const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
                .from('wearco')
                .createSignedUrl(`templates/${template.visual_document}`, 3600); // 1 hour expiry

            if (!signedUrlError && signedUrlData) {
                pdfUrl = signedUrlData.signedUrl;
            }
        }

        return {
            mode,
            template,
            drawing,
            pdfUrl
        };
    } catch (err) {
        // Any error (database, network, etc.) - redirect to drawings list
        throw redirect(302, '/drawings');
    }
};