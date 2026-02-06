import jsPDF from 'jspdf';
import type { TemplateField } from '../types';

interface FieldValues {
    [key: string]: string | number;
}

interface ExportOptions {
    filename?: string;
    pdfUrl: string;
    fieldValues: FieldValues;
    fields: TemplateField[];
    pageWidth: number;
    pageHeight: number;
}

/**
 * Generates a PDF with the template and overlay values embedded as text
 */
export async function exportPdfWithOverlay(options: ExportOptions): Promise<void> {
    const {
        filename = 'edge-template-filled.pdf',
        pdfUrl,
        fieldValues,
        fields,
        pageWidth,
        pageHeight
    } = options;

    try {
        // Fetch the original PDF as an image via canvas
        const response = await fetch(pdfUrl);
        const pdfBlob = await response.blob();
        const pdfUrl2 = URL.createObjectURL(pdfBlob);

        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        // Use local worker file via Vite's URL handling
        const workerUrl = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).href;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const loadingTask = pdfjsLib.getDocument(pdfUrl2);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Render at high resolution for quality
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not create canvas context');
        }

        await page.render({
            canvasContext: context,
            viewport,
            canvas: context.canvas
        }).promise;

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Create jsPDF document (A4 size by default)
        const pdfDoc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: [pageWidth, pageHeight]
        });

        // Add the PDF template as background image
        pdfDoc.addImage(
            imgData,
            'JPEG',
            0,
            0,
            pageWidth,
            pageHeight
        );

        // Set font for text overlay
        pdfDoc.setFont('helvetica');
        pdfDoc.setTextColor(0, 0, 0);

        // Add each field value as text at its configured position
        for (const field of fields) {
            const value = fieldValues[field.id];
            if (value !== undefined && value !== null && value !== '') {
                const text = String(value);
                const fontSize = field.fontSize || 12;
                const textPosition = field.textPosition || 'left';

                pdfDoc.setFontSize(fontSize);

                // Position text - PDF.js renders from top-left, jsPDF y is from top
                // Add small offset to center text vertically in the field
                const textY = field.position.y + (field.position.height / 2) + (fontSize / 3);
                
                // Calculate X position based on text alignment
                let textX: number;
                const padding = 4;
                
                if (textPosition === 'center') {
                    // For center alignment, x is the center of the field
                    textX = field.position.x + (field.position.width / 2);
                } else if (textPosition === 'right') {
                    // For right alignment, x is the right edge of the field minus padding
                    textX = field.position.x + field.position.width - padding;
                } else {
                    // For left alignment (default), x is the left edge plus padding
                    textX = field.position.x + padding;
                }

                // Map textPosition to jsPDF alignment option
                const align = textPosition === 'center' ? 'center' : textPosition === 'right' ? 'right' : 'left';
                
                pdfDoc.text(text, textX, textY, { align });
            }
        }

        // Download the PDF
        pdfDoc.save(filename);

        // Cleanup
        URL.revokeObjectURL(pdfUrl2);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
