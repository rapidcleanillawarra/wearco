<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import OverlayInput from "./OverlayInput.svelte";
    import overlayFieldsConfig from "../config/center_edge-overlays.json";

    // Bindable props for all overlay values
    let {
        centerEdgeWidth = $bindable(1000),
        centerEdgeHeight = $bindable(500),
        holeCount = $bindable(10),
        holeSizeMm = $bindable(100),
        centerEdgePitch = $bindable(250),
        totalHoleDistanceMm = $bindable(500),
        centerEdgeHoleLeft = $bindable(0),
        centerEdgeHoleRight = $bindable(0),
        customerName = $bindable(""),
        orderNumber = $bindable(""),
        date = $bindable(""),
        material = $bindable(""),
        pdfUrl = "/assets/edge_template2.pdf",
    }: {
        centerEdgeWidth?: number;
        centerEdgeHeight?: number;
        holeCount?: number;
        holeSizeMm?: number;
        centerEdgePitch?: number;
        totalHoleDistanceMm?: number;
        centerEdgeHoleLeft?: number;
        centerEdgeHoleRight?: number;
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
        holeCount,
        holeSizeMm,
        centerEdgePitch,
        totalHoleDistanceMm,
        centerEdgeHoleLeft,
        centerEdgeHoleRight,
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
            case "holeCount":
                holeCount = Number(value);
                break;
            case "holeSizeMm":
                holeSizeMm = Number(value);
                break;
            case "centerEdgePitch":
                centerEdgePitch = Number(value);
                break;
            case "totalHoleDistanceMm":
                totalHoleDistanceMm = Number(value);
                break;
            case "centerEdgeHoleLeft":
                centerEdgeHoleLeft = Number(value);
                break;
            case "centerEdgeHoleRight":
                centerEdgeHoleRight = Number(value);
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
</script>

<div class="pdf-overlay-container" bind:this={containerElement}>
    <div class="pdf-header">
        <h2>PDF Template</h2>
        <p class="hint">
            Fill in the fields below. Values will sync with the drawing.
        </p>
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
