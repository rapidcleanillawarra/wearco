import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
    const templateId = url.searchParams.get('template_id');
    const drawingId = url.searchParams.get('id');

    if (!templateId && !drawingId) {
        throw error(400, 'Missing template_id or id parameter');
    }

    let template;
    let drawing = null;

    if (drawingId) {
        // Edit Mode: Fetch existing drawing
        const { data: existingDrawing, error: drawingErr } = await locals.supabase
            .from('wearco_drawings')
            .select(`
                *,
                template:wearco_templates(*)
            `)
            .eq('id', drawingId)
            .single();

        if (drawingErr || !existingDrawing) {
            console.error('Error fetching drawing:', drawingErr);
            throw error(404, 'Drawing not found');
        }

        drawing = existingDrawing;
        template = existingDrawing.template;
    } else if (templateId) {
        // New Mode: Fetch template
        const { data: fetchedTemplate, error: templateErr } = await locals.supabase
            .from('wearco_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (templateErr || !fetchedTemplate) {
            console.error('Error fetching template:', templateErr);
            throw error(404, 'Template not found');
        }

        template = fetchedTemplate;
    }

    // Fetch default SVG diagrams (needed for defaults if not overridden by drawing)
    const { data: svgDiagrams, error: svgErr } = await locals.supabase
        .from('wearco_svg_diagrams')
        .select('*')
        .eq('template_id', template.id);

    if (svgErr) {
        console.error('Error fetching SVG diagrams:', svgErr);
    }

    // Generate PDF URL from storage if visual_document is set
    let pdfUrl: string | undefined = undefined;
    if (template.visual_document) {
        const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
            .from('wearco')
            .createSignedUrl(`templates/${template.visual_document}`, 3600); // 1 hour expiry

        if (signedUrlData) {
            pdfUrl = signedUrlData.signedUrl;
        }
    }

    return {
        template,
        drawing,
        svgDiagrams: svgDiagrams || [],
        pdfUrl
    };
};

export const actions = {
    save: async ({ request, locals }) => {
        const formData = await request.formData();

        // Extract drawing metadata
        const drawingId = formData.get('drawingId') as string;
        const templateId = formData.get('templateId') as string;
        const customer = formData.get('customer') as string;
        const jobNumber = formData.get('jobNumber') as string; // maps to drawing.job_number or work_order
        const material = formData.get('material') as string;

        // Extract diagram data
        const diagramsJson = formData.get('diagrams') as string;

        if (!templateId || !diagramsJson) {
            return { success: false, error: 'Missing required data' };
        }

        const drawingData = JSON.parse(diagramsJson);
        const name = `${customer || 'Unknown'} - ${jobNumber || 'No Job'}`;

        const payload = {
            template_id: templateId,
            customer: customer,
            work_order: jobNumber, // Using work_order field for Job/Order #
            material: material,
            name: name,
            drawing_data: drawingData,
            updated_at: new Date().toISOString()
        };

        let resultId;

        if (drawingId) {
            // Update existing drawing
            const { error, data } = await locals.supabase
                .from('wearco_drawings')
                .update(payload)
                .eq('id', drawingId)
                .select()
                .single();

            if (error) {
                console.error('Error updating drawing:', error);
                return { success: false, error: 'Failed to update drawing' };
            }
            resultId = data.id;
        } else {
            // Create new drawing
            const { error, data } = await locals.supabase
                .from('wearco_drawings')
                .insert({
                    ...payload,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating drawing:', error);
                return { success: false, error: 'Failed to create drawing' };
            }
            resultId = data.id;
        }

        // Redirect to drawings list or stay on page? 
        // Typically redirect to list or the edit page for the new item.
        // For now, let's redirect to the list to confirm it "saved and closed"
        throw redirect(303, '/drawings');
    }
};
