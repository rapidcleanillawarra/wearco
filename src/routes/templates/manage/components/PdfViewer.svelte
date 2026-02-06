<script lang="ts">
    import { onMount } from "svelte";

    let {
        url,
        children,
        pdfDimensions = $bindable({ width: 0, height: 0 }),
    } = $props<{
        url: string | null | undefined;
        children?: import("svelte").Snippet;
        pdfDimensions?: { width: number; height: number };
    }>();

    // PDF Viewer State
    let pdfDoc: any = $state(null);
    let pdfContainer: HTMLDivElement | undefined = $state();
    let isLoadingPdf = $state(false);
    let pdfError = $state<string | null>(null);
    let pdfjsLib: any = $state(null);

    // Internal PDF dimensions
    let pdfWidth = $state(0);
    let pdfHeight = $state(0);

    // Sync internal dimensions to bindable prop
    $effect(() => {
        pdfDimensions.width = pdfWidth;
        pdfDimensions.height = pdfHeight;
    });

    onMount(async () => {
        try {
            const lib = await import("pdfjs-dist");
            pdfjsLib = lib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url,
            ).toString();
        } catch (e) {
            console.error("Failed to load pdfjs-dist", e);
            pdfError = "Failed to load PDF library";
        }
    });

    // Load PDF when URL is available
    $effect(() => {
        if (url && pdfContainer && pdfjsLib) {
            loadPdf(url);
        }
    });

    async function loadPdf(pdfUrl: string) {
        if (!pdfUrl || !pdfjsLib) return;

        try {
            isLoadingPdf = true;
            pdfError = null;

            // Clear existing content
            if (pdfContainer) {
                pdfContainer.innerHTML = "";
            }

            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            pdfDoc = await loadingTask.promise;

            // Render all pages
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                await renderPage(pageNum);
            }
        } catch (err: any) {
            console.error("Error loading PDF:", err);
            pdfError = err.message || "Failed to load PDF";
        } finally {
            isLoadingPdf = false;
        }
    }

    async function renderPage(pageNum: number) {
        if (!pdfDoc || !pdfContainer) return;

        try {
            const page = await pdfDoc.getPage(pageNum);

            // create canvas for the page
            const canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";
            pdfContainer.appendChild(canvas);

            // Adjust scale to fit container width, but maintain high quality
            const containerWidth = pdfContainer.clientWidth - 40; // minus padding

            // Enforce a minimum width for readability on small screens
            // This prevents the PDF from rendering too small/blurry on phones
            const targetWidth = Math.max(containerWidth, 800);

            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = targetWidth / unscaledViewport.width;
            // Ensure a minimum scale for readability if container is small
            const finalScale = Math.max(scale, 1.0);

            const viewport = page.getViewport({ scale: finalScale });

            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Update PDF dimensions (for first page)
            if (pageNum === 1) {
                pdfWidth = viewport.width;
                pdfHeight = viewport.height;
            }

            // High DPI support
            const dpr = window.devicePixelRatio || 1;
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
            canvas.width = viewport.width * dpr;
            canvas.height = viewport.height * dpr;
            const context = canvas.getContext("2d");

            if (context) {
                context.scale(dpr, dpr);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
            }
        } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
        }
    }
</script>

<div class="pdf-viewer-root">
    {#if url}
        <div class="pdf-viewer-wrapper">
            {#if isLoadingPdf}
                <div class="loading-state">
                    <span class="spinner-large"></span>
                    <p>Loading PDF...</p>
                </div>
            {/if}

            {#if pdfError}
                <div class="error-state">
                    <p>Error: {pdfError}</p>
                </div>
            {/if}

            <!-- Container for PDF Canvases -->
            <div class="pdf-canvas-container">
                <div bind:this={pdfContainer} class="pdf-render-target"></div>

                <!-- Render overlay as a snippet if provided -->
                {#if children && pdfWidth > 0 && pdfHeight > 0}
                    <div
                        class="pdf-overlay-wrapper"
                        style="width: {pdfWidth}px; height: {pdfHeight}px;"
                        data-pdf-width={pdfWidth}
                        data-pdf-height={pdfHeight}
                    >
                        {@render children()}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <h3>No PDF Document</h3>
            <p>This template doesn't have an associated PDF document.</p>
        </div>
    {/if}
</div>

<style>
    .pdf-viewer-root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .pdf-viewer-wrapper {
        width: 100%;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        align-items: flex-start; /* Changed from center to allow scrolling */
        padding: var(--spacing-xs);
        min-height: 600px;
        padding-top: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        flex: 1;
        overflow-x: auto; /* Enable horizontal scrolling */
    }

    .pdf-canvas-container {
        position: relative;
        width: fit-content;
        min-width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .pdf-render-target {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        width: 100%;
        align-items: center;
    }

    .pdf-overlay-wrapper {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
    }

    /* Style for dynamic canvases */
    :global(.pdf-page-canvas) {
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-radius: var(--radius-sm);
        max-width: none; /* Removed max-width 100% to allow horizontal overflow */
        height: auto !important; /* Allow aspect ratio to remain */
    }

    .loading-state,
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;
        color: var(--color-gray);
        width: 100%;
    }

    .error-state {
        color: #ef4444;
    }

    .empty-state {
        text-align: center;
        padding: 4rem var(--spacing-xl);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .empty-state-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: var(--font-size-2xl);
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--color-white);
    }

    .empty-state p {
        color: var(--color-gray);
        margin: 0 0 var(--spacing-lg) 0;
    }

    .spinner-large {
        width: 40px;
        height: 40px;
        border: 4px solid var(--color-primary-dim);
        border-top-color: var(--color-primary);
        border-radius: var(--radius-full);
        animation: spin 0.8s linear infinite;
        margin-bottom: var(--spacing-md);
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
