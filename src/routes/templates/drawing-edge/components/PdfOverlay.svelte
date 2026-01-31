<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import OverlayInput from "./OverlayInput.svelte";
    import overlayFieldsConfig from "../config/overlays.json";
    import {
        exportPdfWithOverlay,
        mapStateToFieldValues,
    } from "../utils/pdfExport";

    // Bindable props for all overlay values
    let {
        centerEdgeWidth = $bindable(1000),
        centerEdgeHeight = $bindable(500),
        centerEdgeHoleCount = $bindable(10),
        centerEdgeHoleSize = $bindable(10),
        centerEdgeHoleType = $bindable("circle"),
        centerEdgePitch = $bindable(250),
        centerEdgeTotalHoleDistance = $bindable(500),
        centerEdgeHoleLeft = $bindable(0),
        centerEdgeHoleRight = $bindable(0),
        centerEdgePlateThicknessAndGrade = $bindable(""),
        centerEdgeQuantity = $bindable(1),
        centerEdgeBevelAngleAndType = $bindable(""),
        centerEdgeBevelTopAndBottom = $bindable("both"),
        centerEdgeSingleOrDoubleBevel = $bindable("single"),
        endEdgeWidth = $bindable(300),
        endEdgeHeight = $bindable(150),
        endEdgeHoleCount = $bindable(4),
        endEdgeHoleSize = $bindable(10),
        endEdgeHoleType = $bindable("circle"),
        endEdgePitch = $bindable(60),
        endEdgeTotalHoleDistance = $bindable(180),
        endEdgeHoleLeft = $bindable(60),
        endEdgeHoleRight = $bindable(60),
        endEdgePlateThicknessAndGrade = $bindable(""),
        endEdgeQuantity = $bindable(1),
        endEdgeBevelAngleAndType = $bindable(""),
        endEdgeBevelTopAndBottom = $bindable("both"),
        endEdgeSingleOrDoubleBevel = $bindable("single"),
        topSideWidth = $bindable(200),
        topSideBeforeCurve = $bindable(50),
        topSideAfterCurve = $bindable(50),
        topSideAngle = $bindable(45),
        generalQuantity = $bindable(1),
        generalJobNumber = $bindable(""),
        generalWorkOrder = $bindable(""),
        generalDwgNumber = $bindable(""),
        generalDl = $bindable(""),
        generalCheckedBy = $bindable(""),
        generalProgBy = $bindable(""),
        generalCustomer = $bindable(""),
        generalMaterial = $bindable(""),
        generalThk = $bindable(""),
        customerName = $bindable(""),
        orderNumber = $bindable(""),
        date = $bindable(""),
        material = $bindable(""),
        pdfUrl = "/assets/edge_template2.pdf",
    }: {
        centerEdgeWidth?: number;
        centerEdgeHeight?: number;
        centerEdgeHoleCount?: number;
        centerEdgeHoleSize?: number;
        centerEdgeHoleType?: string;
        centerEdgePitch?: number;
        centerEdgeTotalHoleDistance?: number;
        centerEdgeHoleLeft?: number;
        centerEdgeHoleRight?: number;
        centerEdgePlateThicknessAndGrade?: string;
        centerEdgeQuantity?: number;
        centerEdgeBevelAngleAndType?: string;
        centerEdgeBevelTopAndBottom?: string;
        centerEdgeSingleOrDoubleBevel?: string;
        endEdgeWidth?: number;
        endEdgeHeight?: number;
        endEdgeHoleCount?: number;
        endEdgeHoleSize?: number;
        endEdgeHoleType?: string;
        endEdgePitch?: number;
        endEdgeTotalHoleDistance?: number;
        endEdgeHoleLeft?: number;
        endEdgeHoleRight?: number;
        endEdgePlateThicknessAndGrade?: string;
        endEdgeQuantity?: number;
        endEdgeBevelAngleAndType?: string;
        endEdgeBevelTopAndBottom?: string;
        endEdgeSingleOrDoubleBevel?: string;
        topSideWidth?: number;
        topSideBeforeCurve?: number;
        topSideAfterCurve?: number;
        topSideAngle?: number;
        generalQuantity?: number;
        generalJobNumber?: string;
        generalWorkOrder?: string;
        generalDwgNumber?: string;
        generalDl?: string;
        generalCheckedBy?: string;
        generalProgBy?: string;
        generalCustomer?: string;
        generalMaterial?: string;
        generalThk?: string;
        customerName?: string;
        orderNumber?: string;
        date?: string;
        material?: string;
        pdfUrl?: string;
    } = $props();

    // Map of bindsTo keys to their values
    const valueMap = $derived({
        centerEdgeWidth,
        centerEdgeHeight,
        centerEdgeHoleCount,
        centerEdgeHoleSize,
        centerEdgeHoleType,
        centerEdgePitch,
        centerEdgeTotalHoleDistance,
        centerEdgeHoleLeft,
        centerEdgeHoleRight,
        centerEdgePlateThicknessAndGrade,
        centerEdgeQuantity,
        centerEdgeBevelAngleAndType,
        centerEdgeBevelTopAndBottom,
        centerEdgeSingleOrDoubleBevel,
        endEdgeWidth,
        endEdgeHeight,
        endEdgeHoleCount,
        endEdgeHoleSize,
        endEdgeHoleType,
        endEdgePitch,
        endEdgeTotalHoleDistance,
        endEdgeHoleLeft,
        endEdgeHoleRight,
        endEdgePlateThicknessAndGrade,
        endEdgeQuantity,
        endEdgeBevelAngleAndType,
        endEdgeBevelTopAndBottom,
        endEdgeSingleOrDoubleBevel,
        topSideWidth,
        topSideBeforeCurve,
        topSideAfterCurve,
        topSideAngle,
        generalQuantity,
        generalJobNumber,
        generalWorkOrder,
        generalDwgNumber,
        generalDl,
        generalCheckedBy,
        generalProgBy,
        generalCustomer,
        generalMaterial,
        generalThk,
        customerName,
        orderNumber,
        date,
        material,
    });

    let canvasElement: HTMLCanvasElement;
    let containerElement: HTMLDivElement;
    let pdfLoaded = $state(false);
    let pdfError = $state<string | null>(null);
    let scale = $state(1);
    let originalWidth = $state(595);
    let originalHeight = $state(842);

    // Field values as a reactive object
    let fieldValues = $state<Record<string, string | number>>({});

    // Initialize field values from props
    $effect(() => {
        const newValues: Record<string, string | number> = {};
        for (const field of overlayFieldsConfig.fields) {
            const key = field.bindsTo;
            if (key in valueMap) {
                newValues[field.id] = valueMap[key as keyof typeof valueMap];
            }
        }
        fieldValues = newValues;
    });

    // Sync field values back to props
    function updateFieldValue(fieldId: string, value: string | number) {
        fieldValues[fieldId] = value;

        // Find the field config to get bindsTo
        const field = overlayFieldsConfig.fields.find((f) => f.id === fieldId);
        if (!field) return;

        // Update the corresponding prop
        switch (field.bindsTo) {
            case "centerEdgeWidth":
                centerEdgeWidth = Number(value);
                break;
            case "centerEdgeHeight":
                centerEdgeHeight = Number(value);
                break;
            case "centerEdgeHoleCount":
                centerEdgeHoleCount = Number(value);
                break;
            case "centerEdgeHoleSize":
                centerEdgeHoleSize = Number(value);
                break;
            case "centerEdgeHoleType":
                centerEdgeHoleType = String(value);
                break;
            case "centerEdgePitch":
                centerEdgePitch = Number(value);
                break;
            case "centerEdgeTotalHoleDistance":
                centerEdgeTotalHoleDistance = Number(value);
                break;
            case "centerEdgeHoleLeft":
                centerEdgeHoleLeft = Number(value);
                break;
            case "centerEdgeHoleRight":
                centerEdgeHoleRight = Number(value);
                break;
            case "centerEdgePlateThicknessAndGrade":
                centerEdgePlateThicknessAndGrade = String(value);
                break;
            case "centerEdgeQuantity":
                centerEdgeQuantity = Number(value);
                break;
            case "centerEdgeBevelAngleAndType":
                centerEdgeBevelAngleAndType = String(value);
                break;
            case "centerEdgeBevelTopAndBottom":
                centerEdgeBevelTopAndBottom = String(value);
                break;
            case "centerEdgeSingleOrDoubleBevel":
                centerEdgeSingleOrDoubleBevel = String(value);
                break;
            case "endEdgeWidth":
                endEdgeWidth = Number(value);
                break;
            case "endEdgeHeight":
                endEdgeHeight = Number(value);
                break;
            case "endEdgeHoleCount":
                endEdgeHoleCount = Number(value);
                break;
            case "endEdgeHoleSize":
                endEdgeHoleSize = Number(value);
                break;
            case "endEdgeHoleType":
                endEdgeHoleType = String(value);
                break;
            case "endEdgePitch":
                endEdgePitch = Number(value);
                break;
            case "endEdgeTotalHoleDistance":
                endEdgeTotalHoleDistance = Number(value);
                break;
            case "endEdgeHoleLeft":
                endEdgeHoleLeft = Number(value);
                break;
            case "endEdgeHoleRight":
                endEdgeHoleRight = Number(value);
                break;
            case "endEdgePlateThicknessAndGrade":
                endEdgePlateThicknessAndGrade = String(value);
                break;
            case "endEdgeQuantity":
                endEdgeQuantity = Number(value);
                break;
            case "endEdgeBevelAngleAndType":
                endEdgeBevelAngleAndType = String(value);
                break;
            case "endEdgeBevelTopAndBottom":
                endEdgeBevelTopAndBottom = String(value);
                break;
            case "endEdgeSingleOrDoubleBevel":
                endEdgeSingleOrDoubleBevel = String(value);
                break;
            case "topSideWidth":
                topSideWidth = Number(value);
                break;
            case "topSideBeforeCurve":
                topSideBeforeCurve = Number(value);
                break;
            case "topSideAfterCurve":
                topSideAfterCurve = Number(value);
                break;
            case "topSideAngle":
                topSideAngle = Number(value);
                break;
            case "generalQuantity":
                generalQuantity = Number(value);
                break;
            case "generalJobNumber":
                generalJobNumber = String(value);
                break;
            case "generalWorkOrder":
                generalWorkOrder = String(value);
                break;
            case "generalDwgNumber":
                generalDwgNumber = String(value);
                break;
            case "generalDl":
                generalDl = String(value);
                break;
            case "generalCheckedBy":
                generalCheckedBy = String(value);
                break;
            case "generalProgBy":
                generalProgBy = String(value);
                break;
            case "generalCustomer":
                generalCustomer = String(value);
                break;
            case "generalMaterial":
                generalMaterial = String(value);
                break;
            case "generalThk":
                generalThk = String(value);
                break;
            case "customerName":
                customerName = String(value);
                break;
            case "orderNumber":
                orderNumber = String(value);
                break;
            case "date":
                date = String(value);
                break;
            case "material":
                material = String(value);
                break;
        }
    }

    async function loadPdf() {
        if (!browser) return;

        try {
            pdfError = null;

            // Dynamically import pdfjs-dist only on client side
            const pdfjsLib = await import("pdfjs-dist");

            // Use local worker file via Vite's URL handling
            const workerUrl = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url,
            ).href;

            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1 });
            originalWidth = viewport.width;
            originalHeight = viewport.height;

            // Calculate scale to fit container width
            const containerWidth = containerElement?.clientWidth || 800;
            scale = containerWidth / viewport.width;

            const scaledViewport = page.getViewport({ scale });

            canvasElement.width = scaledViewport.width;
            canvasElement.height = scaledViewport.height;

            const context = canvasElement.getContext("2d");
            if (!context) {
                throw new Error("Could not get canvas context");
            }

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
                canvas: context.canvas,
            }).promise;

            pdfLoaded = true;
        } catch (err) {
            console.error("Error loading PDF:", err);
            pdfError =
                err instanceof Error ? err.message : "Failed to load PDF";
        }
    }

    onMount(() => {
        loadPdf();

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (pdfLoaded) {
                loadPdf();
            }
        });

        if (containerElement) {
            resizeObserver.observe(containerElement);
        }

        return () => {
            resizeObserver.disconnect();
        };
    });

    let isExporting = $state(false);
    let exportError = $state<string | null>(null);

    async function handlePrintPdf() {
        isExporting = true;
        exportError = null;

        try {
            const fieldValues = mapStateToFieldValues(valueMap);

            await exportPdfWithOverlay({
                pdfUrl,
                fieldValues,
                filename: `edge-template-${orderNumber || "filled"}.pdf`,
            });
        } catch (err) {
            console.error("Export failed:", err);
            exportError = err instanceof Error ? err.message : "Export failed";
        } finally {
            isExporting = false;
        }
    }
</script>

<div class="pdf-overlay-container" bind:this={containerElement}>
    <div class="pdf-header">
        <div class="header-content">
            <div>
                <h2>Edge Template</h2>
                <p class="hint">
                    Fill in the fields below. Values will sync with the drawing.
                </p>
            </div>
            <div class="header-actions">
                <button
                    class="print-pdf-btn"
                    onclick={handlePrintPdf}
                    disabled={isExporting}
                >
                    {#if isExporting}
                        <span class="spinner-small"></span>
                        Generating...
                    {:else}
                        📄 Print PDF
                    {/if}
                </button>
                {#if exportError}
                    <span class="export-error">{exportError}</span>
                {/if}
            </div>
        </div>
    </div>

    <div class="pdf-wrapper" style="height: {originalHeight * scale}px;">
        {#if pdfError}
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <p>Failed to load PDF: {pdfError}</p>
                <button onclick={loadPdf}>Retry</button>
            </div>
        {:else if !pdfLoaded}
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading PDF...</p>
            </div>
        {/if}

        <canvas bind:this={canvasElement} class="pdf-canvas"></canvas>

        {#if pdfLoaded}
            <div class="overlay-container">
                {#each overlayFieldsConfig.fields as field (field.id)}
                    <OverlayInput
                        {field}
                        {scale}
                        bind:value={
                            () => fieldValues[field.id],
                            (v) => updateFieldValue(field.id, v)
                        }
                    />
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .pdf-overlay-container {
        width: 100%;
        margin-bottom: 30px;
    }

    .pdf-header {
        margin-bottom: 16px;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .header-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
    }

    .print-pdf-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .print-pdf-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .print-pdf-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .export-error {
        color: #ef4444;
        font-size: 12px;
    }

    .pdf-header h2 {
        margin: 0 0 4px 0;
        color: #1f2937;
        font-size: 20px;
    }

    .pdf-header .hint {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
    }

    .pdf-wrapper {
        position: relative;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #f9fafb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .pdf-canvas {
        display: block;
        width: 100%;
        height: auto;
    }

    .overlay-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .overlay-container :global(.overlay-input-wrapper) {
        pointer-events: auto;
    }

    .loading,
    .error-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 20;
    }

    .loading p,
    .error-message p {
        margin: 12px 0 0 0;
        color: #6b7280;
    }

    .error-message {
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .error-icon {
        font-size: 48px;
    }

    .error-message button {
        margin-top: 12px;
        padding: 8px 16px;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    .error-message button:hover {
        background: #4338ca;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
