<script lang="ts">
    import type { Snippet } from "svelte";

    // Props for editable drawing values (bindable for two-way sync)
    let {
        centerEdgeWidthPx = $bindable(1000),
        centerEdgeHeightPx = $bindable(200),
        centerEdgeHoleType = $bindable("circle"),
        centerEdgeHoleCount = $bindable(10),
        centerEdgeHoleSizePx = $bindable(20),
        centerEdgeWidth = $bindable(1000),
        centerEdgeHeight = $bindable(500),
        centerEdgeHoleSize = $bindable(10),
        centerEdgePitch = $bindable(250),
        centerEdgeTotalHoleDistance = $bindable(500),
        centerEdgeHoleLeft = $bindable(250),
        centerEdgeHoleRight = $bindable(250),
    }: {
        centerEdgeWidthPx?: number;
        centerEdgeHeightPx?: number;
        centerEdgeHoleType?: string;
        centerEdgeHoleCount?: number;
        centerEdgeHoleSizePx?: number;
        centerEdgeWidth?: number;
        centerEdgeHeight?: number;
        centerEdgeHoleSize?: number;
        centerEdgePitch?: number;
        centerEdgeTotalHoleDistance?: number;
        centerEdgeHoleLeft?: number;
        centerEdgeHoleRight?: number;
    } = $props();

    // Internal state for positioning and interaction
    let rectX = $state(50);
    let rectY = $state(50);
    let isDragging = $state(false);
    let isResizing = $state(false);
    let dragStart = $state({ x: 0, y: 0 });
    let resizeStart = $state({ width: 0, height: 0 });

    // SVG canvas dimensions
    let svgWidth = $state(600);
    const svgHeight = 400;

    // Zoom functionality
    let zoomLevel = $state(1);
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5;
    const ZOOM_STEP = 0.1;

    // Derived values for layout (px only)
    let centerEdgePitchPx = $derived(
        centerEdgeWidthPx / (centerEdgeHoleCount + 1),
    );

    function handleWidthChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            centerEdgeWidthPx = value;
        }
    }

    function handleHeightChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            centerEdgeHeightPx = value;
        }
    }

    // MM label handlers (purely cosmetic - do not affect SVG)
    function handleWidthMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            centerEdgeWidth = value;
        }
    }

    function handleHeightMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            centerEdgeHeight = value;
        }
    }

    function handleHolePitchMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            centerEdgePitch = value;
        }
    }

    function handleHoleLeftMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0 && value <= 99999) {
            centerEdgeHoleLeft = value;
        }
    }

    function handleHoleRightMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0 && value <= 99999) {
            centerEdgeHoleRight = value;
        }
    }

    function handleTotalHoleDistanceMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            centerEdgeTotalHoleDistance = value;
        }
    }

    function handleHoleSizeMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            centerEdgeHoleSize = value;
        }
    }

    function handleHoleCountChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0) {
            centerEdgeHoleCount = value;
        }
    }

    function handleHoleSizeChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            centerEdgeHoleSizePx = value;
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

    function handleMouseDown(event: MouseEvent) {
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
        rectX = Math.max(0, Math.min(newX, svgWidth - centerEdgeWidthPx));
        rectY = Math.max(0, Math.min(newY, svgHeight - centerEdgeHeightPx));
    }

    function handleMouseUp() {
        isDragging = false;
        isResizing = false;
    }

    function handleResizeMouseDown(event: MouseEvent) {
        event.stopPropagation(); // Prevent triggering drag
        isResizing = true;
        resizeStart = { width: centerEdgeWidthPx, height: centerEdgeHeightPx };
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

        centerEdgeWidthPx = newWidth;
        centerEdgeHeightPx = newHeight;
    }

    function exportSvg() {
        const svg = document.querySelector(".svg-canvas") as SVGSVGElement;
        if (!svg) return;

        // Clone the SVG to clean it up for export
        const clone = svg.cloneNode(true) as SVGSVGElement;

        // Remove UI elements like resize handles from the export
        const handles = clone.querySelectorAll(".resize-handle");
        handles.forEach((h) => h.remove());

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clone);

        // Add name spaces if missing
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

        // Add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        const blob = new Blob([source], {
            type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "drawing-edge.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>

<div class="svg-drawing-container">
    <div class="header-section">
        <h2>Center Edge Drawing</h2>

        <div class="editor-controls">
            <button class="export-btn" onclick={exportSvg}>Export SVG</button>
        </div>
    </div>

    <!-- Bind container clientWidth to svgWidth state -->
    <div class="svg-container" bind:clientWidth={svgWidth}>
        <div
            class="svg-wrapper"
            style="transform: scale({zoomLevel}); transform-origin: top left; width: 100%; height: 100%;"
        >
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox="0 0 {svgWidth} {svgHeight}"
                class="svg-canvas"
                onmousedown={handleMouseDown}
                onmousemove={(e) => {
                    handleMouseMove(e);
                    handleResizeMouseMove(e);
                }}
                onmouseup={handleMouseUp}
                onmouseleave={handleMouseUp}
                onwheel={handleWheelZoom}
                role="application"
                aria-label="Drawing canvas"
            >
                <!-- Grid background for better positioning -->
                <defs>
                    <marker
                        id="arrow-start"
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
                        id="arrow-end"
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

                <!-- Width Dimension -->
                <g class="dimension-line">
                    <line
                        x1={rectX + 5}
                        y1={rectY - 20}
                        x2={rectX + centerEdgeWidthPx - 5}
                        y2={rectY - 20}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#arrow-start)"
                        marker-end="url(#arrow-end)"
                    />
                    <text
                        x={rectX + centerEdgeWidthPx / 2}
                        y={rectY - 30}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                    >
                        {centerEdgeWidth} mm
                    </text>
                </g>

                <!-- Height Dimension -->
                <g class="dimension-line">
                    <line
                        x1={rectX - 20}
                        y1={rectY + 5}
                        x2={rectX - 20}
                        y2={rectY + centerEdgeHeightPx - 5}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#arrow-start)"
                        marker-end="url(#arrow-end)"
                    />
                    <text
                        x={rectX - 35}
                        y={rectY + centerEdgeHeightPx / 2}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                        transform="rotate(-90, {rectX - 35}, {rectY +
                            centerEdgeHeightPx / 2})"
                    >
                        {centerEdgeHeight} mm
                    </text>
                </g>

                <!-- Main rectangle -->
                <rect
                    x={rectX}
                    y={rectY}
                    width={centerEdgeWidthPx}
                    height={centerEdgeHeightPx}
                    fill="white"
                    stroke="#1e1b4b"
                    stroke-width="2"
                    rx="4"
                    class="rectangle"
                />

                <!-- Hole Spacing Dimensions -->
                {#if centerEdgeHoleCount > 0}
                    <!-- Left Edge to First Hole -->
                    <g class="dimension-line">
                        <line
                            x1={rectX + 5}
                            y1={rectY + centerEdgeHeightPx / 2}
                            x2={rectX + centerEdgePitchPx - 5}
                            y2={rectY + centerEdgeHeightPx / 2}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <text
                            x={rectX + centerEdgePitchPx / 2}
                            y={rectY + centerEdgeHeightPx / 2 - 10}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {centerEdgeHoleLeft} mm
                        </text>
                    </g>

                    <!-- Last Hole to Right Edge -->
                    <g class="dimension-line">
                        <line
                            x1={rectX +
                                centerEdgeWidthPx -
                                centerEdgePitchPx +
                                5}
                            y1={rectY + centerEdgeHeightPx / 2}
                            x2={rectX + centerEdgeWidthPx - 5}
                            y2={rectY + centerEdgeHeightPx / 2}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <text
                            x={rectX +
                                centerEdgeWidthPx -
                                centerEdgePitchPx / 2}
                            y={rectY + centerEdgeHeightPx / 2 - 10}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {centerEdgeHoleRight} mm
                        </text>
                    </g>
                {/if}

                <!-- Holes -->
                {#each Array(centerEdgeHoleCount) as _, i}
                    {@const cx = rectX + (i + 1) * centerEdgePitchPx}
                    {@const cy = rectY + centerEdgeHeightPx / 2}

                    {#if centerEdgeHoleType === "circle"}
                        <circle
                            {cx}
                            {cy}
                            r={centerEdgeHoleSizePx / 2}
                            fill="white"
                            stroke="#1e1b4b"
                            stroke-width="1.5"
                        />
                    {:else}
                        <rect
                            x={cx - centerEdgeHoleSizePx / 2}
                            y={cy - centerEdgeHoleSizePx / 2}
                            width={centerEdgeHoleSizePx}
                            height={centerEdgeHoleSizePx}
                            fill="white"
                            stroke="#1e1b4b"
                            stroke-width="1.5"
                        />
                    {/if}
                {/each}

                <!-- Hole Diameter Dimension (on top of first hole) -->
                {#if centerEdgeHoleCount > 0}
                    {@const firstHoleCx = rectX + centerEdgePitchPx}
                    {@const firstHoleCy = rectY + centerEdgeHeightPx / 2}
                    {@const dimY = firstHoleCy - centerEdgeHoleSizePx / 2 - 15}

                    <g class="dimension-line">
                        <!-- Horizontal dimension line (showing diameter) -->
                        <line
                            x1={firstHoleCx - centerEdgeHoleSizePx / 2 + 5}
                            y1={dimY}
                            x2={firstHoleCx + centerEdgeHoleSizePx / 2 - 5}
                            y2={dimY}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <!-- Extension lines (going up) -->
                        <line
                            x1={firstHoleCx - centerEdgeHoleSizePx / 2}
                            y1={firstHoleCy - centerEdgeHoleSizePx / 2 - 3}
                            x2={firstHoleCx - centerEdgeHoleSizePx / 2}
                            y2={dimY - 5}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={firstHoleCx + centerEdgeHoleSizePx / 2}
                            y1={firstHoleCy - centerEdgeHoleSizePx / 2 - 3}
                            x2={firstHoleCx + centerEdgeHoleSizePx / 2}
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
                            Ø{centerEdgeHoleSize} mm
                        </text>
                    </g>
                {/if}

                <!-- Resize handles -->

                <!-- Hole Dimensions -->
                {#if centerEdgeHoleCount > 1}
                    {@const firstHoleX = rectX + centerEdgePitchPx}
                    {@const secondHoleX = rectX + 2 * centerEdgePitchPx}
                    {@const lastHoleX =
                        rectX + centerEdgeHoleCount * centerEdgePitchPx}
                    {@const holeCenterY = rectY + centerEdgeHeightPx / 2}

                    <!-- Top Dimension Position (Pitch) -->
                    {@const dimY_top =
                        holeCenterY - centerEdgeHoleSizePx / 2 - 20}

                    <!-- Bottom Dimension Position (Total) -->
                    {@const dimY_bottom =
                        holeCenterY + centerEdgeHoleSizePx / 2 + 20}

                    <!-- Total Distance Dimension Position (Lower) -->
                    {@const dimY_total = dimY_bottom + 30}

                    <!-- First to Second Hole (Pitch) - BOTTOM -->
                    <g class="dimension-line">
                        <!-- Extension lines (going down) -->
                        <line
                            x1={firstHoleX}
                            y1={holeCenterY + centerEdgeHoleSizePx / 2 + 5}
                            x2={firstHoleX}
                            y2={dimY_bottom + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={secondHoleX}
                            y1={holeCenterY + centerEdgeHoleSizePx / 2 + 5}
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
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <text
                            x={firstHoleX + (secondHoleX - firstHoleX) / 2}
                            y={dimY_bottom + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {centerEdgePitch} mm
                        </text>
                    </g>

                    <!-- First to Last Hole (Total) - BOTTOM - Only if more than 2 holes -->
                    {#if centerEdgeHoleCount > 2}
                        <g class="dimension-line">
                            <!-- Extension lines (going down) -->
                            <line
                                x1={firstHoleX}
                                y1={holeCenterY + centerEdgeHoleSizePx / 2 + 5}
                                x2={firstHoleX}
                                y2={dimY_total + 10}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />
                            <line
                                x1={lastHoleX}
                                y1={holeCenterY + centerEdgeHoleSizePx / 2 + 5}
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
                                marker-start="url(#arrow-start)"
                                marker-end="url(#arrow-end)"
                            />
                            <text
                                x={firstHoleX + (lastHoleX - firstHoleX) / 2}
                                y={dimY_total + 15}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                {centerEdgeTotalHoleDistance} mm
                            </text>
                        </g>
                    {/if}
                {/if}
                <circle
                    cx={rectX + centerEdgeWidthPx}
                    cy={rectY + centerEdgeHeightPx}
                    r="6"
                    fill="#ef4444"
                    class="resize-handle"
                    onmousedown={handleResizeMouseDown}
                    role="button"
                    tabindex="0"
                    aria-label="Resize handle"
                />
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
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 20px;
        flex-wrap: wrap;
        gap: 20px;
    }

    h2 {
        color: #1f2937;
        margin: 0;
        font-size: 20px;
    }

    .editor-controls {
        display: flex;
        align-items: center;
    }

    .svg-container {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        flex: 1;
        position: relative;
        min-height: 400px;
    }

    .svg-wrapper {
        transform-origin: top left;
        width: 100%;
        height: 100%;
    }

    .svg-canvas {
        cursor: move;
        display: block;
        background-color: #ffffff;
    }

    .svg-canvas:hover :global(.rectangle) {
        stroke-width: 3;
    }

    :global(.rectangle) {
        transition: stroke-width 0.2s;
        cursor: move;
    }

    .resize-handle {
        cursor: nw-resize;
        opacity: 0.8;
    }

    .resize-handle:hover {
        opacity: 1;
    }

    .export-btn {
        background-color: #4f46e5;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-right: 20px;
    }

    .export-btn:hover {
        background-color: #4338ca;
    }
</style>
