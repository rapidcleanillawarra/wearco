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

    let pdfContainer: HTMLDivElement | undefined = $state();
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

    $effect(() => {
        if (url && pdfContainer && pdfjsLib) {
            loadPdf(url);
        }
    });

    async function loadPdf(pdfUrl: string) {
        if (!pdfUrl || !pdfjsLib) return;

        try {
            if (pdfContainer) {
                pdfContainer.innerHTML = "";
            }

            const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, verbosity: 0 });
            const pdfDoc = await loadingTask.promise;

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const canvas = document.createElement("canvas");
                canvas.className = "pdf-page-canvas";
                pdfContainer!.appendChild(canvas);

                const containerWidth = pdfContainer!.clientWidth || window.innerWidth;
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

    function getFieldStyle(field: TemplateField) {
        const { position, fontSize = 10, textPosition = "left", rotation = 0 } = field;
        return `
            position: absolute;
            left: ${position.x * scaleX}px;
            top: ${position.y * scaleY}px;
            width: ${position.width * scaleX}px;
            height: ${position.height * scaleY}px;
            font-size: ${fontSize * Math.min(scaleX, scaleY)}px;
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
            left: ${position.x * scaleX}px;
            top: ${position.y * scaleY}px;
            width: ${position.width * scaleX}px;
            height: ${position.height * scaleY}px;
            font-size: ${fontSize * Math.min(scaleX, scaleY)}px;
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
            left: ${optionPosition.x * scaleX}px;
            top: ${optionPosition.y * scaleY}px;
            width: ${optionPosition.width * scaleX}px;
            height: ${optionPosition.height * scaleY}px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
    }
</script>

<div class="view-pdf-root">
    {#if url}
        <div class="pdf-canvas-container">
            <div bind:this={pdfContainer} class="pdf-render-target"></div>

            {#if templateData?.fields && pdfWidth > 0 && pdfHeight > 0}
                <div
                    class="pdf-overlay"
                    style="width: {pdfWidth}px; height: {pdfHeight}px;"
                >
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
    }

    .pdf-render-target {
        display: flex;
        flex-direction: column;
        width: 100%;
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
        pointer-events: none;
    }

    .radio-dot {
        width: 8px;
        height: 8px;
        background: #000;
        border-radius: 50%;
    }
</style>
