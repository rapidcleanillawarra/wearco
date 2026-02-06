<script lang="ts">
    import type { Snippet } from "svelte";

    // Props
    let {
        config,
        data = $bindable(),
    }: {
        config: any;
        data: any;
    } = $props();

    // -- State Mappers --
    // We Map internal variable names to the external data via config.params
    // This allows the component to work with generic data keys

    // Helpers to safely access data or default
    const getParam = (key: string, def: any) => {
        const paramKey = config.params?.[key];
        if (!paramKey) return def;
        return data[paramKey] !== undefined ? data[paramKey] : def;
    };

    const setParam = (key: string, value: any) => {
        const paramKey = config.params?.[key];
        if (paramKey) {
            data[paramKey] = value;
        }
    };

    // Derived values for Edge Logic (Legacy Support)
    // These are only used if we fallback to the hardcoded "Edge" logic
    let widthPx = $derived(getParam("widthPx", 1000));
    let heightPx = $derived(getParam("heightPx", 200));
    let width = $derived(getParam("width", 1000));
    let height = $derived(getParam("height", 500));

    // Edge specific
    let holeType = $derived(getParam("holeType", "circle"));
    let holeCount = $derived(getParam("holeCount", 10));
    let holeSizePx = $derived(getParam("holeSizePx", 20));
    let holeSize = $derived(getParam("holeSize", 10));
    let pitch = $derived(getParam("pitch", 250));
    let totalHoleDistance = $derived(getParam("totalHoleDistance", 500));
    let holeLeft = $derived(getParam("holeLeft", 250));
    let holeRight = $derived(getParam("holeRight", 250));

    // Position
    let rectX = $derived(getParam("rectX", 50));
    let rectY = $derived(getParam("rectY", 50));

    // Internal state for positioning and interaction
    let isDragging = $state(false);
    let isResizing = $state(false);
    let dragStart = $state({ x: 0, y: 0 });
    let resizeStart = $state({ width: 0, height: 0 });

    // SVG canvas dimensions
    let containerWidth = $state(600);
    // Allow SVG width to grow with content
    let svgWidth = $derived(Math.max(containerWidth, widthPx + 100));
    const svgHeight = 400; // Fixed height for now, could be dynamic

    // Zoom functionality
    let zoomLevel = $state(1);
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5;
    const ZOOM_STEP = 0.1;

    // Derived values for layout (px only)
    let pitchPx = $derived(widthPx / (holeCount + 1));

    // -- Handlers --

    function handleWidthPxChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            setParam("widthPx", value);
        }
    }

    function handleHeightPxChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            setParam("heightPx", value);
        }
    }

    function zoomIn() {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
    }

    function zoomOut() {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
    }

    function resetZoom() {
        zoomLevel = 1;
    }

    function handleWheelZoom(event: WheelEvent) {
        event.preventDefault();
        if (event.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    }

    // Generic Drag Logic
    function handleMouseDown(event: MouseEvent) {
        // Only allow dragging if we are not clicking a control?
        // For now, dragging anywhere on SVG moves the content "if" we support moving content.
        // The original logic moved the "rectX/Y".
        // Generic logic: we might want to pan the VIEWBOX instead of the object?
        // But for consistency let's keep moving the "Object Position" if params exist.

        if (!config.params?.rectX || !config.params?.rectY) return;

        isDragging = true;
        const svg = event.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();
        // Adjust coordinates for zoom
        dragStart = {
            x: (event.clientX - rect.left) / zoomLevel - rectX,
            y: (event.clientY - rect.top) / zoomLevel - rectY,
        };
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) return;

        const svg = event.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        const mouseX = (event.clientX - rect.left) / zoomLevel;
        const mouseY = (event.clientY - rect.top) / zoomLevel;

        const newX = mouseX - dragStart.x;
        const newY = mouseY - dragStart.y;

        // Keep rectangle within bounds
        const newRectX = Math.max(0, Math.min(newX, svgWidth - (widthPx || 0)));
        const newRectY = Math.max(
            0,
            Math.min(newY, svgHeight - (heightPx || 0)),
        );

        // Update data
        setParam("rectX", newRectX);
        setParam("rectY", newRectY);
    }

    function handleMouseUp() {
        isDragging = false;
        isResizing = false;
    }

    function handleResizeMouseDown(event: MouseEvent) {
        event.stopPropagation(); // Prevent triggering drag
        isResizing = true;
        resizeStart = { width: widthPx, height: heightPx };
        const svg = (event.currentTarget as Element).closest(
            "svg",
        ) as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        dragStart = {
            x: (event.clientX - rect.left) / zoomLevel,
            y: (event.clientY - rect.top) / zoomLevel,
        };
    }

    function handleResizeMouseMove(event: MouseEvent) {
        if (!isResizing) return;

        const svg = event.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        const currentX = (event.clientX - rect.left) / zoomLevel;
        const currentY = (event.clientY - rect.top) / zoomLevel;

        const deltaX = currentX - dragStart.x;
        const deltaY = currentY - dragStart.y;

        const newWidth = Math.max(10, resizeStart.width + deltaX);
        const newHeight = Math.max(10, resizeStart.height + deltaY);

        setParam("widthPx", newWidth);
        setParam("heightPx", newHeight);
    }

    // Export function
    function exportSvg() {
        const svg = document.querySelector(
            `.svg-canvas-${config.id}`,
        ) as SVGSVGElement;
        if (!svg) return;

        const clone = svg.cloneNode(true) as SVGSVGElement;
        const handles = clone.querySelectorAll(".resize-handle");
        handles.forEach((h) => h.remove());

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clone);

        if (
            !source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)
        ) {
            source = source.replace(
                /^<svg/,
                '<svg xmlns="http://www.w3.org/2000/svg" ',
            );
        }
        if (
            !source.match(
                /^<svg[^>]+xmlns:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/,
            )
        ) {
            source = source.replace(
                /^<svg/,
                '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ',
            );
        }

        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        const blob = new Blob([source], {
            type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${config.id}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Variable substitutions for generic templates
    function processTemplate(template: string) {
        if (!template) return "";
        // We replace {{variable}} with value from params
        let result = template;

        // 1. Replace mapped params
        if (config.params) {
            Object.entries(config.params).forEach(([key, dataKey]) => {
                const val = data[dataKey as string];
                if (val !== undefined) {
                    result = result.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        String(val),
                    );
                }
            });
        }

        // 2. Also allow direct data access via {{data.xyz}}? Maybe too complex for now.
        // Stick to mapped params for safety/simplicity.

        return result;
    }

    let renderedTemplate = $derived(processTemplate(config.svg_template));
</script>

<div class="svg-drawing-container">
    <div class="header-section">
        <div class="editor-controls">
            <!-- Show Dimension Controls only if relevant params exist -->
            {#if config.params?.widthPx && config.params?.heightPx}
                <div class="dimension-controls">
                    <div class="control-group">
                        <label for="{config.id}-width-control">W:</label>
                        <input
                            id="{config.id}-width-control"
                            type="number"
                            value={widthPx}
                            oninput={handleWidthPxChange}
                            min="10"
                            class="dim-input"
                        />
                    </div>
                    <div class="control-group">
                        <label for="{config.id}-height-control">H:</label>
                        <input
                            id="{config.id}-height-control"
                            type="number"
                            value={heightPx}
                            oninput={handleHeightPxChange}
                            min="10"
                            class="dim-input"
                        />
                    </div>
                </div>
            {/if}

            <div class="zoom-controls">
                <button
                    class="icon-btn"
                    onclick={zoomOut}
                    aria-label="Zoom Out"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <span class="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button class="icon-btn" onclick={zoomIn} aria-label="Zoom In">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button
                    class="icon-btn reset-btn"
                    onclick={resetZoom}
                    aria-label="Reset Zoom"
                    title="Reset Zoom"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
            </div>
            <button class="export-btn" onclick={exportSvg}>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span class="btn-text">Export SVG</span>
            </button>
        </div>
    </div>

    <!-- Bind container clientWidth to containerWidth state -->
    <div class="svg-container" bind:clientWidth={containerWidth}>
        <div
            class="svg-wrapper"
            style="transform: scale({zoomLevel}); transform-origin: top left; width: 100%; height: 100%;"
        >
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox="0 0 {svgWidth} {svgHeight}"
                class="svg-canvas svg-canvas-{config.id}"
                onmousedown={handleMouseDown}
                onmousemove={(e) => {
                    handleMouseMove(e);
                    handleResizeMouseMove(e);
                }}
                onmouseup={handleMouseUp}
                onmouseleave={handleMouseUp}
                onwheel={handleWheelZoom}
                role="application"
                aria-label="{config.title} canvas"
            >
                <defs>
                    <marker
                        id="arrow-start-{config.id}"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                    >
                        <path d="M 10 0 L 0 5 L 10 10 z" fill="#374151" />
                    </marker>
                    <marker
                        id="arrow-end-{config.id}"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
                    </marker>
                </defs>

                {#if config.svg_template}
                    <!-- GENERIC RENDERER -->
                    {@html renderedTemplate}

                    <!-- Generic Resize Handle if width/height params exist -->
                    {#if config.params?.widthPx && config.params?.heightPx}
                        <circle
                            cx={rectX + widthPx}
                            cy={rectY + heightPx}
                            r="6"
                            fill="#ef4444"
                            class="resize-handle"
                            onmousedown={handleResizeMouseDown}
                            role="button"
                            tabindex="0"
                            aria-label="Resize handle"
                        />
                    {/if}
                {:else}
                    <!-- LEGACY FALLBACK (Hardcoded Edge Logic) -->

                    <!-- Width Dimension -->
                    <g class="dimension-line">
                        <line
                            x1={rectX + 5}
                            y1={rectY - 20}
                            x2={rectX + widthPx - 5}
                            y2={rectY - 20}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start-{config.id})"
                            marker-end="url(#arrow-end-{config.id})"
                        />
                        <text
                            x={rectX + widthPx / 2}
                            y={rectY - 30}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {width} mm
                        </text>
                    </g>

                    <!-- Height Dimension -->
                    <g class="dimension-line">
                        <line
                            x1={rectX - 20}
                            y1={rectY + 5}
                            x2={rectX - 20}
                            y2={rectY + heightPx - 5}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start-{config.id})"
                            marker-end="url(#arrow-end-{config.id})"
                        />
                        <text
                            x={rectX - 35}
                            y={rectY + heightPx / 2}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                            transform="rotate(-90, {rectX - 35}, {rectY +
                                heightPx / 2})"
                        >
                            {height} mm
                        </text>
                    </g>

                    <!-- Main rectangle -->
                    <rect
                        x={rectX}
                        y={rectY}
                        width={widthPx}
                        height={heightPx}
                        fill="white"
                        stroke="#1e1b4b"
                        stroke-width="2"
                        rx="4"
                        class="rectangle"
                    />

                    <!-- Hole Spacing Dimensions -->
                    {#if holeCount > 0}
                        <!-- Left Edge to First Hole -->
                        <g class="dimension-line">
                            <line
                                x1={rectX + 5}
                                y1={rectY + heightPx / 2}
                                x2={rectX + pitchPx - 5}
                                y2={rectY + heightPx / 2}
                                stroke="#374151"
                                stroke-width="1.5"
                                marker-start="url(#arrow-start-{config.id})"
                                marker-end="url(#arrow-end-{config.id})"
                            />
                            <text
                                x={rectX + pitchPx / 2}
                                y={rectY + heightPx / 2 - 10}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                {holeLeft} mm
                            </text>
                        </g>

                        <!-- Last Hole to Right Edge -->
                        <g class="dimension-line">
                            <line
                                x1={rectX + widthPx - pitchPx + 5}
                                y1={rectY + heightPx / 2}
                                x2={rectX + widthPx - 5}
                                y2={rectY + heightPx / 2}
                                stroke="#374151"
                                stroke-width="1.5"
                                marker-start="url(#arrow-start-{config.id})"
                                marker-end="url(#arrow-end-{config.id})"
                            />
                            <text
                                x={rectX + widthPx - pitchPx / 2}
                                y={rectY + heightPx / 2 - 10}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                {holeRight} mm
                            </text>
                        </g>
                    {/if}

                    <!-- Holes -->
                    {#each Array(holeCount) as _, i}
                        {@const cx = rectX + (i + 1) * pitchPx}
                        {@const cy = rectY + heightPx / 2}

                        {#if holeType === "circle"}
                            <circle
                                {cx}
                                {cy}
                                r={holeSizePx / 2}
                                fill="white"
                                stroke="#1e1b4b"
                                stroke-width="1.5"
                            />
                        {:else}
                            <rect
                                x={cx - holeSizePx / 2}
                                y={cy - holeSizePx / 2}
                                width={holeSizePx}
                                height={holeSizePx}
                                fill="white"
                                stroke="#1e1b4b"
                                stroke-width="1.5"
                            />
                        {/if}
                    {/each}

                    <!-- Hole Diameter Dimension (on top of first hole) -->
                    {#if holeCount > 0}
                        {@const firstHoleCx = rectX + pitchPx}
                        {@const firstHoleCy = rectY + heightPx / 2}
                        {@const dimY = firstHoleCy - holeSizePx / 2 - 15}

                        <g class="dimension-line">
                            <!-- Horizontal dimension line (showing diameter) -->
                            <line
                                x1={firstHoleCx - holeSizePx / 2 + 5}
                                y1={dimY}
                                x2={firstHoleCx + holeSizePx / 2 - 5}
                                y2={dimY}
                                stroke="#374151"
                                stroke-width="1.5"
                                marker-start="url(#arrow-start-{config.id})"
                                marker-end="url(#arrow-end-{config.id})"
                            />
                            <!-- Extension lines (going up) -->
                            <line
                                x1={firstHoleCx - holeSizePx / 2}
                                y1={firstHoleCy - holeSizePx / 2 - 3}
                                x2={firstHoleCx - holeSizePx / 2}
                                y2={dimY - 5}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />
                            <line
                                x1={firstHoleCx + holeSizePx / 2}
                                y1={firstHoleCy - holeSizePx / 2 - 3}
                                x2={firstHoleCx + holeSizePx / 2}
                                y2={dimY - 5}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />
                            <!-- Text label -->
                            <text
                                x={firstHoleCx}
                                y={dimY - 8}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                Ø{holeSize} mm
                            </text>
                        </g>
                    {/if}

                    <!-- Resize handles -->
                    <circle
                        cx={rectX + widthPx}
                        cy={rectY + heightPx}
                        r="6"
                        fill="#ef4444"
                        class="resize-handle"
                        onmousedown={handleResizeMouseDown}
                        role="button"
                        tabindex="0"
                        aria-label="Resize handle"
                    />

                    <!-- Hole Dimensions -->
                    {#if holeCount > 1}
                        {@const firstHoleX = rectX + pitchPx}
                        {@const secondHoleX = rectX + 2 * pitchPx}
                        {@const lastHoleX = rectX + holeCount * pitchPx}
                        {@const holeCenterY = rectY + heightPx / 2}

                        <!-- Bottom Dimension Position (Total) -->
                        {@const dimY_bottom = holeCenterY + holeSizePx / 2 + 20}

                        <!-- Total Distance Dimension Position (Lower) -->
                        {@const dimY_total = dimY_bottom + 30}

                        <!-- First to Second Hole (Pitch) - BOTTOM -->
                        <g class="dimension-line">
                            <!-- Extension lines (going down) -->
                            <line
                                x1={firstHoleX}
                                y1={holeCenterY + holeSizePx / 2 + 5}
                                x2={firstHoleX}
                                y2={dimY_bottom + 10}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />
                            <line
                                x1={secondHoleX}
                                y1={holeCenterY + holeSizePx / 2 + 5}
                                x2={secondHoleX}
                                y2={dimY_bottom + 10}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />

                            <!-- Dimension line -->
                            <line
                                x1={firstHoleX + 5}
                                y1={dimY_bottom}
                                x2={secondHoleX - 5}
                                y2={dimY_bottom}
                                stroke="#374151"
                                stroke-width="1.5"
                                marker-start="url(#arrow-start-{config.id})"
                                marker-end="url(#arrow-end-{config.id})"
                            />
                            <text
                                x={firstHoleX + (secondHoleX - firstHoleX) / 2}
                                y={dimY_bottom + 15}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                {pitch} mm
                            </text>
                        </g>

                        <!-- First to Last Hole (Total) - BOTTOM - Only if more than 2 holes -->
                        {#if holeCount > 2}
                            <g class="dimension-line">
                                <!-- Extension lines (going down) -->
                                <line
                                    x1={firstHoleX}
                                    y1={holeCenterY + holeSizePx / 2 + 5}
                                    x2={firstHoleX}
                                    y2={dimY_total + 10}
                                    stroke="#9ca3af"
                                    stroke-width="1"
                                    stroke-dasharray="4 2"
                                />
                                <line
                                    x1={lastHoleX}
                                    y1={holeCenterY + holeSizePx / 2 + 5}
                                    x2={lastHoleX}
                                    y2={dimY_total + 10}
                                    stroke="#9ca3af"
                                    stroke-width="1"
                                    stroke-dasharray="4 2"
                                />

                                <!-- Dimension line -->
                                <line
                                    x1={firstHoleX + 5}
                                    y1={dimY_total}
                                    x2={lastHoleX - 5}
                                    y2={dimY_total}
                                    stroke="#374151"
                                    stroke-width="1.5"
                                    marker-start="url(#arrow-start-{config.id})"
                                    marker-end="url(#arrow-end-{config.id})"
                                />
                                <text
                                    x={firstHoleX +
                                        (lastHoleX - firstHoleX) / 2}
                                    y={dimY_total + 15}
                                    fill="#374151"
                                    font-size="12"
                                    text-anchor="middle"
                                >
                                    {totalHoleDistance} mm
                                </text>
                            </g>
                        {/if}
                    {/if}
                {/if}
            </svg>
        </div>
    </div>
</div>

<style>
    .svg-drawing-container {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .header-section {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 1rem;
    }

    .editor-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .zoom-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.25rem;
        border-radius: 8px;
    }

    .zoom-level {
        font-variant-numeric: tabular-nums;
        font-size: 0.9rem;
        color: var(--color-gray);
        min-width: 3.5ch;
        text-align: center;
    }

    .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--color-gray);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .icon-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-white);
    }

    .reset-btn {
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        padding-left: 0.5rem;
        margin-left: 0.25rem;
    }

    .export-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(250, 194, 17, 0.1);
        color: var(--color-gold);
        border: 1px solid rgba(250, 194, 17, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .export-btn:hover {
        background: rgba(250, 194, 17, 0.2);
        transform: translateY(-1px);
    }

    .dimension-controls {
        display: flex;
        gap: 1rem;
        margin-right: 1rem;
        padding-right: 1rem;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .control-group label {
        color: var(--color-gray);
        font-size: 0.85rem;
        font-weight: 500;
    }

    .dim-input {
        width: 70px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--color-white);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .dim-input:focus {
        outline: none;
        border-color: var(--color-gold);
    }

    .svg-container {
        width: 100%;
        height: 400px;
        background: #f8fafc; /* Slate 50 */
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .svg-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
    }

    .svg-wrapper:active {
        cursor: grabbing;
    }

    .svg-canvas {
        background-color: transparent;
    }

    :global(.resize-handle) {
        cursor: nwse-resize;
        stroke: white;
        stroke-width: 2px;
        transition: r 0.2s;
    }

    :global(.resize-handle:hover) {
        r: 8px;
    }
</style>
