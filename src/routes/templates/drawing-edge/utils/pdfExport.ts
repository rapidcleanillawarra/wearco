import jsPDF from 'jspdf';
import overlayFieldsConfig from '../config/overlays.json';

interface FieldValues {
    [key: string]: string | number;
}

interface ExportOptions {
    filename?: string;
    pdfUrl: string;
    fieldValues: FieldValues;
}

/**
 * Generates a PDF with the template and overlay values embedded as text
 */
export async function exportPdfWithOverlay(options: ExportOptions): Promise<void> {
    const { filename = 'edge-template-filled.pdf', pdfUrl, fieldValues } = options;

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
            format: [overlayFieldsConfig.pageWidth, overlayFieldsConfig.pageHeight]
        });

        // Add the PDF template as background image
        pdfDoc.addImage(
            imgData,
            'JPEG',
            0,
            0,
            overlayFieldsConfig.pageWidth,
            overlayFieldsConfig.pageHeight
        );

        // Set font for text overlay
        pdfDoc.setFont('helvetica');
        pdfDoc.setTextColor(0, 0, 0);

        // Add each field value as text at its configured position
        for (const field of overlayFieldsConfig.fields) {
            const value = fieldValues[field.id];
            if (value !== undefined && value !== null && value !== '') {
                const text = String(value);
                const fontSize = field.fontSize || 12;

                pdfDoc.setFontSize(fontSize);

                // Position text - PDF.js renders from top-left, jsPDF y is from top
                // Add small offset to center text vertically in the field
                const textY = field.position.y + (field.position.height / 2) + (fontSize / 3);
                const textX = field.position.x + 4; // Small left padding

                pdfDoc.text(text, textX, textY);
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

/**
 * Get field values mapped by field ID from the state values
 */
export function mapStateToFieldValues(stateValues: {
    centerEdgeWidth: number;
    centerEdgeHeight: number;
    centerEdgeHoleCount: number;
    centerEdgeHoleSize: number;
    centerEdgePitch: number;
    centerEdgeTotalHoleDistance: number;
    centerEdgeHoleLeft: number;
    centerEdgeHoleRight: number;
    customerName: string;
    orderNumber: string;
    date: string;
    material: string;
}): FieldValues {
    const fieldValues: FieldValues = {};

    for (const field of overlayFieldsConfig.fields) {
        const key = field.bindsTo as keyof typeof stateValues;
        if (key in stateValues) {
            fieldValues[field.id] = stateValues[key];
        }
    }

    return fieldValues;
}
