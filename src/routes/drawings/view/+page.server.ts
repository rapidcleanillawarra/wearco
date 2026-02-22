import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { ViewPageData } from './types';
import type { WearcoDiagram } from '$lib/types/svg_diagram';

export const load: PageServerLoad = async ({ locals, url }): Promise<ViewPageData> => {
    const drawingId = url.searchParams.get('id');

    if (!drawingId) {
        throw redirect(302, '/drawings');
    }

    try {
        const { data: drawing, error: drawingErr } = await locals.supabase
            .from('drawings')
            .select('*')
            .eq('id', drawingId)
            .single();

        if (drawingErr || !drawing) {
            throw redirect(302, '/drawings');
        }

        if (!drawing.template_id) {
            throw redirect(302, '/drawings');
        }

        const { data: template, error: templateErr } = await locals.supabase
            .from('templates')
            .select('*')
            .eq('id', drawing.template_id)
            .single();

        if (templateErr || !template) {
            throw redirect(302, '/drawings');
        }

        let diagrams: WearcoDiagram[] = [];
        const { data: diagramsData, error: diagramsErr } = await locals.supabase
            .from('diagrams')
            .select('*')
            .eq('template_id', template.id)
            .order('created_at', { ascending: false });

        if (!diagramsErr && diagramsData) {
            diagrams = await Promise.all(diagramsData.map(async (diagram) => {
                if (diagram.file) {
                    const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
                        .from('wearco')
                        .createSignedUrl(diagram.file, 3600);

                    if (!signedUrlError && signedUrlData) {
                        return { ...diagram, signedUrl: signedUrlData.signedUrl };
                    }
                }
                return diagram;
            }));
        }

        let pdfUrl: string | undefined;
        if (template.visual_document) {
            const fullPath = template.visual_document.startsWith('templates/')
                ? template.visual_document
                : `templates/${template.visual_document}`;

            const { data: signedUrlData, error: signedUrlError } = await locals.supabase.storage
                .from('wearco')
                .createSignedUrl(fullPath, 3600);

            if (!signedUrlError && signedUrlData) {
                pdfUrl = signedUrlData.signedUrl;
            }
        }

        return {
            drawing,
            template,
            diagrams,
            pdfUrl
        };
    } catch (err) {
        throw redirect(302, '/drawings');
    }
};
