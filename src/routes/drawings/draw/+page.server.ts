import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
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

export const actions: Actions = {
    save: async ({ request, locals }) => {
        const formData = await request.formData();
        const templateId = formData.get('templateId') as string;
        const drawingId = formData.get('drawingId') as string | null;
        const job_number = (formData.get('job_number') as string) || null;
        const work_order = (formData.get('work_order') as string) || null;
        const drawing_number = (formData.get('drawing_number') as string) || null;
        const name = (formData.get('name') as string) || null;
        const customer = (formData.get('customer') as string) || null;
        const customer_source = (formData.get('customer_source') as string) || null;
        const quantityStr = formData.get('quantity') as string;
        const quantity = quantityStr ? parseInt(quantityStr, 10) || 0 : 0;
        const dl = (formData.get('dl') as string) || null;
        const checked_by = (formData.get('checked_by') as string) || null;
        const prog_by = (formData.get('prog_by') as string) || null;
        const material = (formData.get('material') as string) || null;
        const thk = (formData.get('thk') as string) || null;
        const additional_dataStr = formData.get('additional_data') as string;

        if (!templateId) {
            return fail(400, { success: false, message: 'Template is required' });
        }

        let additional_data: Record<string, unknown> = {};
        try {
            additional_data = JSON.parse(additional_dataStr || '{}');
        } catch {
            additional_data = {};
        }

        const userEmail = (await locals.supabase.auth.getUser()).data.user?.email ?? null;
        const now = new Date().toISOString();

        const payload = {
            template_id: templateId,
            job_number,
            work_order,
            drawing_number,
            name,
            customer,
            customer_source,
            quantity,
            dl,
            checked_by,
            prog_by,
            material,
            thk,
            additional_data,
            updated_at: now,
        };

        if (drawingId) {
            // Update existing drawing
            const { error } = await locals.supabase
                .from('wearco_drawings')
                .update({ ...payload, updated_by: userEmail })
                .eq('id', drawingId);

            if (error) {
                console.error('Error updating drawing:', error);
                return fail(500, { success: false, message: 'Failed to update drawing' });
            }
        } else {
            // Create new drawing
            const { data, error } = await locals.supabase
                .from('wearco_drawings')
                .insert({
                    ...payload,
                    created_by: userEmail,
                    updated_by: userEmail,
                })
                .select('id')
                .single();

            if (error) {
                console.error('Error creating drawing:', error);
                return fail(500, { success: false, message: 'Failed to create drawing' });
            }

            return { success: true, drawingId: data.id };
        }

        return { success: true };
    },
};