<script lang="ts">
    import type { WearcoDiagram } from "$lib/types/svg_diagram";
    import EdgeDiagram from "./EdgeDiagram.svelte";

    let { diagram, fieldValues = {} } = $props<{
        diagram: WearcoDiagram | null;
        fieldValues?: Record<string, string>;
    }>();

    // SVG Content State
    let originalSvgContent = $state<string>("");
    let dynamicSvgContent = $state<string>("");
    let isLoadingSvg = $state(false);

    // Fetch SVG content whenever the diagram changes
    $effect(() => {
        if (!diagram?.signedUrl) {
            originalSvgContent = "";
            return;
        }

        const fetchSvg = async () => {
            isLoadingSvg = true;
            try {
                const response = await fetch(diagram.signedUrl!);
                if (response.ok) {
                    originalSvgContent = await response.text();
                }
            } catch (err) {
                console.error("Failed to fetch SVG:", err);
            } finally {
                isLoadingSvg = false;
            }
        };

        fetchSvg();
    });

    // Reactive SVG content based on fieldValues
    const updatedSvgContent = $derived.by(() => {
        if (!originalSvgContent) return "";
        if (Object.keys(fieldValues).length === 0) return originalSvgContent;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(
                originalSvgContent,
                "image/svg+xml",
            );

            // Update elements by ID
            Object.entries(fieldValues).forEach(([id, val]) => {
                const value = String(val);
                const element = doc.getElementById(id);
                if (element) {
                    const tag = element.tagName.toLowerCase();
                    if (tag === "text" || tag === "tspan") {
                        // If it's a <text> element, it might have nested <tspan>s.
                        // We want to update the text content but preserve the structure.
                        const tspans = element.querySelectorAll("tspan");

                        if (tag === "text" && tspans.length > 0) {
                            // Update the first tspan (usually the one with the value)
                            const firstTspan = tspans[0];
                            const originalText = firstTspan.textContent || "";
                            const hasMM = originalText
                                .toLowerCase()
                                .includes("mm");
                            firstTspan.textContent = hasMM
                                ? `${value} mm`
                                : value;
                        } else {
                            // No tspans or it's a tspan itself
                            const originalText = element.textContent || "";
                            const hasMM = originalText
                                .toLowerCase()
                                .includes("mm");
                            element.textContent = hasMM ? `${value} mm` : value;
                        }
                    }
                }
            });

            return new XMLSerializer().serializeToString(doc);
        } catch (err) {
            console.error("Error updating SVG text:", err);
            return originalSvgContent;
        }
    });

    // Zoom and Pan State
    let zoomLevel = $state(1);
    let panOffset = $state({ x: 0, y: 0 });
    let isDragging = $state(false);
    let startMousePos = $state({ x: 0, y: 0 });
    let startPanOffset = $state({ x: 0, y: 0 });

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 5;
    const ZOOM_STEP = 0.1;

    function zoomIn() {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
    }

    function zoomOut() {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
    }

    function resetZoom() {
        zoomLevel = 1;
        panOffset = { x: 0, y: 0 };
    }

    function handleWheel(event: WheelEvent) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = -event.deltaY;
            if (delta > 0) zoomIn();
            else zoomOut();
        }
    }

    function handleMouseDown(event: MouseEvent) {
        if (zoomLevel <= 1 && panOffset.x === 0 && panOffset.y === 0) return;

        isDragging = true;
        startMousePos = { x: event.clientX, y: event.clientY };
        startPanOffset = { ...panOffset };

        // Prevent text selection while dragging
        event.preventDefault();
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) return;

        const dx = event.clientX - startMousePos.x;
        const dy = event.clientY - startMousePos.y;

        panOffset = {
            x: startPanOffset.x + dx,
            y: startPanOffset.y + dy,
        };
    }

    function stopDragging() {
        isDragging = false;
    }

    async function handleDownload() {
        const content =
            diagram?.type === "edge" ? dynamicSvgContent : updatedSvgContent;
        if (!content) return;

        try {
            const blob = new Blob([content], {
                type: "image/svg+xml",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${diagram?.name.toLowerCase().replace(/\s+/g, "_") || "diagram"}.svg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download SVG.");
        }
    }
</script>

{#if diagram}
    <section class="full-svg-container">
        <div class="viewer-header">
            <div class="header-info">
                <h3>{diagram.name}</h3>
                <span class="badge">{diagram.type || "Diagram"}</span>
            </div>
            <div class="header-actions">
                <div class="zoom-controls">
                    <button class="btn-zoom" onclick={zoomOut} title="Zoom Out">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                    <span class="zoom-value"
                        >{Math.round(zoomLevel * 100)}%</span
                    >
                    <button class="btn-zoom" onclick={zoomIn} title="Zoom In">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" /><line
                                x1="5"
                                y1="12"
                                x2="19"
                                y2="12"
                            />
                        </svg>
                    </button>
                    <button
                        class="btn-zoom btn-reset"
                        onclick={resetZoom}
                        title="Reset Zoom"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path
                                d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                            />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>
                </div>

                <button class="btn-download" onclick={handleDownload}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                </button>
            </div>
        </div>

        <div
            class="svg-stage"
            onwheel={handleWheel}
            onmousedown={handleMouseDown}
            onmousemove={handleMouseMove}
            onmouseup={stopDragging}
            onmouseleave={stopDragging}
            role="application"
            aria-label="SVG Viewer Stage"
            style="cursor: {isDragging
                ? 'grabbing'
                : zoomLevel > 1 || panOffset.x !== 0 || panOffset.y !== 0
                  ? 'grab'
                  : 'default'}"
        >
            <div
                class="svg-canvas"
                style="transform: translate({panOffset.x}px, {panOffset.y}px) scale({zoomLevel}); transform-origin: center;"
            >
                {#if isLoadingSvg}
                    <div class="loading-overlay">
                        <span class="spinner"></span>
                        <span>Loading SVG...</span>
                    </div>
                {:else if diagram?.type === "edge"}
                    <div class="inline-svg-container" draggable="false">
                        <EdgeDiagram
                            {fieldValues}
                            variables={diagram.variables}
                            name={diagram.name}
                            bind:svgString={dynamicSvgContent}
                        />
                    </div>
                {:else if updatedSvgContent}
                    <div class="inline-svg-container" draggable="false">
                        {@html updatedSvgContent}
                    </div>
                {/if}
            </div>
        </div>
    </section>
{/if}

<style>
    .full-svg-container {
        background: var(--gradient-card);
        border: 2px solid var(--color-gold);
        border-radius: var(--radius-2xl);
        overflow: hidden;
        margin-bottom: var(--spacing-xl);
        animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .viewer-header {
        padding: var(--spacing-lg) var(--spacing-xl);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
    }

    .header-info h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        color: var(--color-white);
    }

    .badge {
        font-size: 10px;
        background: rgba(var(--color-gold-rgb), 0.2);
        color: var(--color-gold);
        padding: 2px 8px;
        border-radius: var(--radius-full);
        text-transform: uppercase;
        font-weight: bold;
        margin-top: 4px;
        display: inline-block;
    }

    .header-actions {
        display: flex;
        gap: var(--spacing-xl);
        align-items: center;
    }

    .zoom-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-zoom {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: var(--color-gold);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-zoom:hover {
        background: rgba(var(--color-gold-rgb), 0.1);
        transform: scale(1.1);
    }

    .btn-zoom:active {
        transform: scale(0.95);
    }

    .zoom-value {
        font-size: var(--font-size-sm);
        color: var(--color-white);
        min-width: 45px;
        text-align: center;
        font-weight: bold;
    }

    .btn-reset {
        margin-left: 4px;
        color: var(--color-gray);
    }

    .btn-reset:hover {
        color: var(--color-white);
    }

    .btn-download {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--color-gold);
        color: var(--color-black);
        border: none;
        border-radius: var(--radius-lg);
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-download:hover {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(var(--color-gold-rgb), 0.4);
    }

    .svg-stage {
        padding: var(--spacing-2xl);
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 500px;
        overflow: hidden;
        position: relative;
    }

    .svg-canvas {
        background: white;
        width: 100%;
        max-width: 1200px;
        aspect-ratio: 16/9;
        padding: var(--spacing-2xl);
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        transition: transform 0.05s ease-out;
        position: relative;
    }

    .inline-svg-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .inline-svg-container :global(svg) {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
    }

    .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--color-gray);
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top: 4px solid var(--color-gold);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
