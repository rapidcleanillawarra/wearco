<script lang="ts">
    import { onMount } from "svelte";
    import type { TemplateData, TemplateField } from "../types";

    let {
        url,
        templateData,
        fieldValues = {},
    } = $props<{
        url: string | null | undefined;
        templateData?: TemplateData | null;
        fieldValues?: Record<string, string>;
    }>();

    let firstPageSlot: HTMLDivElement | undefined = $state();
    let restPagesContainer: HTMLDivElement | undefined = $state();
    let pdfjsLib: any = $state(null);
    let pdfWidth = $state(0);
    let pdfHeight = $state(0);

    onMount(async () => {
        try {
            const lib = await import("pdfjs-dist");
            pdfjsLib = lib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url,
            ).toString();
        } catch (e) {
            console.error("Failed to load PDF library");
        }
    });

    let pdfCanvasContainer: HTMLDivElement | undefined = $state();

    $effect(() => {
        if (url && firstPageSlot != null && restPagesContainer != null && pdfjsLib) {
            loadPdf(url);
        }
    });

    async function loadPdf(pdfUrl: string) {
        if (!pdfUrl || !pdfjsLib || !firstPageSlot || !restPagesContainer) return;

        try {
            firstPageSlot.innerHTML = "";
            restPagesContainer.innerHTML = "";

            const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, verbosity: 0 });
            const pdfDoc = await loadingTask.promise;

            const containerWidth =
                pdfCanvasContainer?.clientWidth ??
                firstPageSlot.parentElement?.clientWidth ??
                window.innerWidth;

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const canvas = document.createElement("canvas");
                canvas.className = "pdf-page-canvas";
                const targetContainer = pageNum === 1 ? firstPageSlot : restPagesContainer;
                targetContainer.appendChild(canvas);

                const targetWidth = containerWidth;
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = targetWidth / unscaledViewport.width;
                const viewport = page.getViewport({ scale });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (pageNum === 1) {
                    pdfWidth = viewport.width;
                    pdfHeight = viewport.height;
                }

                const dpr = window.devicePixelRatio || 1;
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;
                canvas.width = viewport.width * dpr;
                canvas.height = viewport.height * dpr;
                const context = canvas.getContext("2d");

                if (context) {
                    context.scale(dpr, dpr);
                    await page.render({ canvasContext: context, viewport }).promise;
                }
            }
        } catch (err) {
            console.error("Failed to load PDF:", err);
        }
    }

    const scaleX = $derived(
        templateData?.pageWidth ? pdfWidth / templateData.pageWidth : 1,
    );
    const scaleY = $derived(
        templateData?.pageHeight ? pdfHeight / templateData.pageHeight : 1,
    );

    /** Use percentages so overlay content scales with the container and stays aligned when printing */
    function pctLeft(x: number) {
        return pdfWidth > 0 ? ((x * scaleX) / pdfWidth) * 100 : 0;
    }
    function pctTop(y: number) {
        return pdfHeight > 0 ? ((y * scaleY) / pdfHeight) * 100 : 0;
    }
    function pctWidth(w: number) {
        return pdfWidth > 0 ? ((w * scaleX) / pdfWidth) * 100 : 0;
    }
    function pctHeight(h: number) {
        return pdfHeight > 0 ? ((h * scaleY) / pdfHeight) * 100 : 0;
    }
    function scaledFontSize(fontSize: number) {
        return fontSize * Math.min(scaleX, scaleY);
    }

    function getFieldStyle(field: TemplateField) {
        const { position, fontSize = 10, textPosition = "left", rotation = 0 } = field;
        return `
            position: absolute;
            left: ${pctLeft(position.x)}%;
            top: ${pctTop(position.y)}%;
            width: ${pctWidth(position.width)}%;
            height: ${pctHeight(position.height)}%;
            font-size: ${scaledFontSize(fontSize)}px;
            text-align: ${textPosition};
            transform: rotate(${rotation}deg);
            transform-origin: center;
            display: flex;
            align-items: center;
            ${textPosition === 'center' ? 'justify-content: center;' : textPosition === 'right' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
            padding: 2px 4px;
            box-sizing: border-box;
            overflow: hidden;
            color: #000;
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.2;
        `;
    }

    function getTextareaStyle(field: TemplateField) {
        const { position, fontSize = 10, textPosition = "left", rotation = 0 } = field;
        return `
            position: absolute;
            left: ${pctLeft(position.x)}%;
            top: ${pctTop(position.y)}%;
            width: ${pctWidth(position.width)}%;
            height: ${pctHeight(position.height)}%;
            font-size: ${scaledFontSize(fontSize)}px;
            text-align: ${textPosition};
            transform: rotate(${rotation}deg);
            transform-origin: center;
            padding: 2px 4px;
            box-sizing: border-box;
            overflow: hidden;
            color: #000;
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.2;
            white-space: pre-wrap;
            word-break: break-word;
        `;
    }

    function getOptionStyle(optionPosition: { x: number; y: number; width: number; height: number }) {
        return `
            position: absolute;
            left: ${pctLeft(optionPosition.x)}%;
            top: ${pctTop(optionPosition.y)}%;
            width: ${pctWidth(optionPosition.width)}%;
            height: ${pctHeight(optionPosition.height)}%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
    }
</script>

<div class="view-pdf-root">
    {#if url}
        <div class="pdf-canvas-container" bind:this={pdfCanvasContainer}>
            <div class="pdf-first-page-wrapper">
                <div bind:this={firstPageSlot} class="pdf-first-page-slot"></div>
                {#if templateData?.fields && pdfWidth > 0 && pdfHeight > 0}
                    <div class="pdf-overlay">
                        {#each templateData.fields as field (field.id)}
                            {#if field.type === "radio"}
                                {#each field.options || [] as option (option.value)}
                                    {#if String(fieldValues[field.id] ?? "") === String(option.value)}
                                        <div
                                            style="{getOptionStyle(option.position)} transform: rotate({field.rotation || 0}deg);"
                                        >
                                            <div class="radio-dot"></div>
                                        </div>
                                    {/if}
                                {/each}
                            {:else if field.type === "textarea"}
                                <div style={getTextareaStyle(field)}>
                                    {fieldValues[field.id] || ""}
                                </div>
                            {:else}
                                <div style={getFieldStyle(field)}>
                                    {fieldValues[field.id] || ""}
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
            <div bind:this={restPagesContainer} class="pdf-rest-pages"></div>
        </div>
    {/if}
</div>

<style>
    .view-pdf-root {
        width: 100%;
        background: white;
    }

    .pdf-canvas-container {
        position: relative;
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .pdf-first-page-wrapper {
        position: relative;
        max-width: 100%;
        display: inline-block;
    }

    .pdf-first-page-slot {
        display: block;
        line-height: 0;
    }

    .pdf-rest-pages {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    :global(.pdf-page-canvas) {
        display: block;
        max-width: 100%;
        height: auto !important;
    }

    .pdf-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        box-sizing: border-box;
    }

    .radio-dot {
        width: 8px;
        height: 8px;
        background: #000;
        border-radius: 50%;
    }

    @media print {
        .pdf-first-page-wrapper {
            break-inside: avoid;
        }
    }
</style>
