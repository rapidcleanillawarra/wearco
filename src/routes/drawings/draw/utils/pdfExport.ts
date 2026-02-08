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
 * Generates a jsPDF instance with the template and overlay values
 */
async function generatePdfDoc(options: ExportOptions): Promise<jsPDF> {
    const {
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

        // Create jsPDF document (orientated landscape by default for templates)
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
                const padding = 4;
                const isTextarea = field.type === 'textarea';

                pdfDoc.setFontSize(fontSize);

                // Calculate X position based on text alignment
                let textX: number;
                if (textPosition === 'center') {
                    textX = field.position.x + (field.position.width / 2);
                } else if (textPosition === 'right') {
                    textX = field.position.x + field.position.width - padding;
                } else {
                    textX = field.position.x + padding;
                }
                const align = textPosition === 'center' ? 'center' : textPosition === 'right' ? 'right' : 'left';

                if (isTextarea) {
                    // Textarea: start from top, wrap to field width, respect newlines
                    const maxWidth = field.position.width - padding * 2;
                    const lineHeight = fontSize * 1.2;
                    let textY = field.position.y + padding + (fontSize / 3);

                    // splitTextToSize handles both newlines and word-wrap within maxWidth
                    const lines = pdfDoc.splitTextToSize(text, maxWidth);

                    for (const line of lines) {
                        // Don't overflow below the field
                        if (textY + lineHeight > field.position.y + field.position.height - padding) break;
                        pdfDoc.text(line, textX, textY, { align });
                        textY += lineHeight;
                    }
                } else {
                    // Single-line: center vertically in the field
                    const textY = field.position.y + (field.position.height / 2) + (fontSize / 3);
                    pdfDoc.text(text, textX, textY, { align });
                }
            }
        }

        // Cleanup
        URL.revokeObjectURL(pdfUrl2);

        return pdfDoc;
    } catch (error) {
        throw error;
    }
}

/**
 * Generates a PDF with the template and overlay values and downloads it
 */
export async function exportPdfWithOverlay(options: ExportOptions): Promise<void> {
    const {
        filename = 'edge-template-filled.pdf'
    } = options;

    try {
        const pdfDoc = await generatePdfDoc(options);
        // Download the PDF
        pdfDoc.save(filename);
    } catch (error) {
        throw error;
    }
}

/**
 * Generates a PDF as a base64 string
 */
export async function generatePdfAsBase64(options: ExportOptions): Promise<string> {
    try {
        const pdfDoc = await generatePdfDoc(options);
        // dataurlstring includes the prefix (data:application/pdf;filename=generated.pdf;base64,)
        // but Power Automate often expects just the content bytes or a clean data URI.
        // We'll return the base64 content part.
        const dataUrl = pdfDoc.output('datauristring');
        // Extract base64 part
        const base64Content = dataUrl.split(',')[1];
        return base64Content;
    } catch (error) {
        throw error;
    }
}
