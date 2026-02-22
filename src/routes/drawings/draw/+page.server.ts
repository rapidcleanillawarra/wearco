import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import type { DrawingPageData } from '../types';
import type { WearcoDiagram } from '$lib/types/svg_diagram';

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
        let diagrams: WearcoDiagram[] = [];
        let pdfUrl: string | undefined;

        if (mode === 'edit') {
            // EDIT mode: fetch drawing first, then template
            const { data: drawingData, error: drawingErr } = await locals.supabase
                .from('drawings')
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
                .from('templates')
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
                .from('templates')
                .select('*')
                .eq('id', targetId)
                .single();

            if (templateErr || !templateData) {
                throw redirect(302, '/drawings');
            }

            template = templateData;
        }

        // Fetch diagrams associated with the template
        const { data: diagramsData, error: diagramsErr } = await locals.supabase
            .from('diagrams')
            .select('*')
            .eq('template_id', template.id)
            .order('created_at', { ascending: false });

        if (diagramsErr) {
            console.error('Error fetching diagrams:', diagramsErr);
            // Don't throw error, just log it and continue with empty diagrams array
        } else {
            const rawDiagrams = diagramsData || [];
            // Generate signed URLs for each diagram
            diagrams = await Promise.all(rawDiagrams.map(async (diagram) => {
                if (diagram.file) {
                    const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
                        .from('wearco')
                        .createSignedUrl(diagram.file, 3600); // 1 hour expiry

                    if (!signedUrlError && signedUrlData) {
                        return { ...diagram, signedUrl: signedUrlData.signedUrl };
                    }
                }
                return diagram;
            }));
        }

        // Generate PDF URL from storage if visual_document is set
        if (template.visual_document) {
            // Check if the path already starts with templates/ to avoid double-prefixing
            const fullPath = template.visual_document.startsWith('templates/')
                ? template.visual_document
                : `templates/${template.visual_document}`;

            const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
                .from('wearco')
                .createSignedUrl(fullPath, 3600); // 1 hour expiry

            if (!signedUrlError && signedUrlData) {
                pdfUrl = signedUrlData.signedUrl;
            }
        }

        return {
            mode,
            template,
            drawing,
            diagrams,
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
        const purchase_order = (formData.get('purchase_order') as string) || null;
        const checked_by = (formData.get('checked_by') as string) || null;
        const prog_by = (formData.get('prog_by') as string) || null;
        const drawing_dataStr = formData.get('drawing_data') as string;

        if (!templateId) {
            return fail(400, { success: false, message: 'Template is required' });
        }

        let drawing_data: Record<string, unknown> = {};
        try {
            drawing_data = JSON.parse(drawing_dataStr || '{}');
        } catch {
            drawing_data = {};
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
            purchase_order,
            checked_by,
            prog_by,
            drawing_data,
            updated_at: now,
        };

        if (drawingId) {
            // Update existing drawing
            const { error } = await locals.supabase
                .from('drawings')
                .update({ ...payload, updated_by: userEmail })
                .eq('id', drawingId);

            if (error) {
                console.error('Error updating drawing:', error);
                return fail(500, { success: false, message: 'Failed to update drawing' });
            }
        } else {
            // Create new drawing
            const { data, error } = await locals.supabase
                .from('drawings')
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