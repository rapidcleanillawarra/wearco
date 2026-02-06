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

    // Fetch associated SVG diagrams
    const { data: svgDiagrams, error: svgErr } = await locals.supabase
        .from('wearco_svg_diagrams')
        .select('*')
        .eq('template_id', template.id);

    if (svgErr) {
        console.error('Error fetching SVG diagrams:', svgErr);
        // We don't throw here to allow the page to load even if diagrams fail (graceful degradation)
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
        svgDiagrams: svgDiagrams || [],
        pdfUrl
    };
};

export const actions = {
    save: async ({ request, locals }) => {
        const formData = await request.formData();
        const templateId = formData.get('templateId') as string;
        const diagramsJson = formData.get('diagrams') as string;

        if (!templateId || !diagramsJson) {
            return { success: false, error: 'Missing required data' };
        }

        const diagrams = JSON.parse(diagramsJson);
        const results = [];

        // Determine which diagrams are for Center Edge and End Edge
        // Ideally we receive an array of { name: 'Center Edge', data: ... }

        for (const diagram of diagrams) {
            // Check if diagram exists
            const { data: existing } = await locals.supabase
                .from('wearco_svg_diagrams')
                .select('id')
                .eq('template_id', templateId)
                .eq('name', diagram.name)
                .single();

            if (existing) {
                // Update
                const { error } = await locals.supabase
                    .from('wearco_svg_diagrams')
                    .update({
                        data: diagram.data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                if (error) console.error(`Error updating ${diagram.name}:`, error);
            } else {
                // Insert
                const { error } = await locals.supabase
                    .from('wearco_svg_diagrams')
                    .insert({
                        template_id: templateId,
                        name: diagram.name,
                        data: diagram.data
                    });
                if (error) console.error(`Error inserting ${diagram.name}:`, error);
            }
        }

        return { success: true };
    }
};
