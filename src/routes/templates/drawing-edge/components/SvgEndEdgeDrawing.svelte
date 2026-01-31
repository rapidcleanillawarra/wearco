<script lang="ts">
    import type { Snippet } from "svelte";

    // Props for editable drawing values (bindable for two-way sync)
    let {
        endEdgeWidthPx = $bindable(300),
        endEdgeHeightPx = $bindable(100),
        endEdgeHoleType = $bindable("circle"),
        endEdgeHoleCount = $bindable(4),
        endEdgeHoleSizePx = $bindable(20),
        endEdgeWidth = $bindable(300),
        endEdgeHeight = $bindable(150),
        endEdgeHoleSize = $bindable(10),
        endEdgePitch = $bindable(60),
        endEdgeTotalHoleDistance = $bindable(180),
        endEdgeHoleLeft = $bindable(60),
        endEdgeHoleRight = $bindable(60),
    }: {
        endEdgeWidthPx?: number;
        endEdgeHeightPx?: number;
        endEdgeHoleType?: string;
        endEdgeHoleCount?: number;
        endEdgeHoleSizePx?: number;
        endEdgeWidth?: number;
        endEdgeHeight?: number;
        endEdgeHoleSize?: number;
        endEdgePitch?: number;
        endEdgeTotalHoleDistance?: number;
        endEdgeHoleLeft?: number;
        endEdgeHoleRight?: number;
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
    let endEdgePitchPx = $derived(endEdgeWidthPx / (endEdgeHoleCount + 1));

    function handleWidthChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            endEdgeWidthPx = value;
        }
    }

    function handleHeightChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            endEdgeHeightPx = value;
        }
    }

    // MM label handlers (purely cosmetic - do not affect SVG)
    function handleWidthMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            endEdgeWidth = value;
        }
    }

    function handleHeightMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            endEdgeHeight = value;
        }
    }

    function handleHolePitchMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            endEdgePitch = value;
        }
    }

    function handleHoleLeftMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0 && value <= 99999) {
            endEdgeHoleLeft = value;
        }
    }

    function handleHoleRightMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0 && value <= 99999) {
            endEdgeHoleRight = value;
        }
    }

    function handleTotalHoleDistanceMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            endEdgeTotalHoleDistance = value;
        }
    }

    function handleHoleSizeMmChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0 && value <= 99999) {
            endEdgeHoleSize = value;
        }
    }

    function handleHoleCountChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value >= 0) {
            endEdgeHoleCount = value;
        }
    }

    function handleHoleSizeChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (!isNaN(value) && value > 0) {
            endEdgeHoleSizePx = value;
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
        rectX = Math.max(0, Math.min(newX, svgWidth - endEdgeWidthPx));
        rectY = Math.max(0, Math.min(newY, svgHeight - endEdgeHeightPx));
    }

    function handleMouseUp() {
        isDragging = false;
        isResizing = false;
    }

    function handleResizeMouseDown(event: MouseEvent) {
        event.stopPropagation(); // Prevent triggering drag
        isResizing = true;
        resizeStart = { width: endEdgeWidthPx, height: endEdgeHeightPx };
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

        endEdgeWidthPx = newWidth;
        endEdgeHeightPx = newHeight;
    }

    function exportSvg() {
        const svg = document.querySelector(
            ".svg-canvas-end-edge",
        ) as SVGSVGElement;
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
        link.download = "end-edge-drawing.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>

<div class="svg-drawing-container">
    <div class="header-section">
        <h2>End Edge Drawing</h2>

        <div class="editor-controls">
            <button class="export-btn" onclick={exportSvg}>Export SVG</button>
            <div class="control-panel">
                <div class="dimension-section">
                    <h3>Dimensions</h3>
                    <div class="input-row">
                        <div class="control-group">
                            <label for="end-width-input">W:</label>
                            <input
                                id="end-width-input"
                                type="number"
                                min="10"
                                max="500"
                                value={endEdgeWidthPx}
                                onchange={handleWidthChange}
                            />
                            <span>px</span>
                        </div>

                        <div class="control-group">
                            <label for="end-height-input">H:</label>
                            <input
                                id="end-height-input"
                                type="number"
                                min="10"
                                max="300"
                                value={endEdgeHeightPx}
                                onchange={handleHeightChange}
                            />
                            <span>px</span>
                        </div>

                        <div class="control-group separator">
                            <label for="end-width-mm-input">W:</label>
                            <input
                                id="end-width-mm-input"
                                type="number"
                                min="1"
                                max="9999"
                                value={endEdgeWidth}
                                onchange={handleWidthMmChange}
                            />
                            <span>mm</span>
                        </div>

                        <div class="control-group">
                            <label for="end-height-mm-input">H:</label>
                            <input
                                id="end-height-mm-input"
                                type="number"
                                min="1"
                                max="9999"
                                value={endEdgeHeight}
                                onchange={handleHeightMmChange}
                            />
                            <span>mm</span>
                        </div>
                    </div>
                </div>

                <div class="holes-section">
                    <h3>Holes</h3>
                    <div class="input-row">
                        <div class="control-group">
                            <label for="end-hole-type">Type:</label>
                            <select
                                id="end-hole-type"
                                bind:value={endEdgeHoleType}
                            >
                                <option value="circle">Circle</option>
                                <option value="square">Square</option>
                            </select>
                        </div>

                        <div class="control-group">
                            <label for="end-hole-count">Count:</label>
                            <input
                                id="end-hole-count"
                                type="number"
                                min="0"
                                max="20"
                                value={endEdgeHoleCount}
                                onchange={handleHoleCountChange}
                            />
                        </div>

                        <div class="control-group">
                            <label for="end-hole-size">Size:</label>
                            <input
                                id="end-hole-size"
                                type="number"
                                min="1"
                                max="100"
                                value={endEdgeHoleSizePx}
                                onchange={handleHoleSizeChange}
                            />
                            <span>px</span>
                        </div>
                    </div>
                </div>

                <div class="mm-labels-section">
                    <h3>MM Labels</h3>
                    <div class="input-row">
                        <div class="control-group">
                            <label for="end-hole-left-mm">Left:</label>
                            <input
                                id="end-hole-left-mm"
                                type="number"
                                min="0"
                                max="99999"
                                value={endEdgeHoleLeft}
                                onchange={handleHoleLeftMmChange}
                            />
                            <span>mm</span>
                        </div>

                        <div class="control-group">
                            <label for="end-hole-right-mm">Right:</label>
                            <input
                                id="end-hole-right-mm"
                                type="number"
                                min="0"
                                max="99999"
                                value={endEdgeHoleRight}
                                onchange={handleHoleRightMmChange}
                            />
                            <span>mm</span>
                        </div>

                        <div class="control-group">
                            <label for="end-hole-spacing-mm">Pitch:</label>
                            <input
                                id="end-hole-spacing-mm"
                                type="number"
                                min="1"
                                max="99999"
                                value={endEdgePitch}
                                onchange={handleHolePitchMmChange}
                            />
                            <span>mm</span>
                        </div>

                        <div class="control-group">
                            <label for="end-total-distance-mm">Total:</label>
                            <input
                                id="end-total-distance-mm"
                                type="number"
                                min="1"
                                max="99999"
                                value={endEdgeTotalHoleDistance}
                                onchange={handleTotalHoleDistanceMmChange}
                            />
                            <span>mm</span>
                        </div>

                        <div class="control-group">
                            <label for="end-hole-size-mm">Hole Ø:</label>
                            <input
                                id="end-hole-size-mm"
                                type="number"
                                min="1"
                                max="99999"
                                value={endEdgeHoleSize}
                                onchange={handleHoleSizeMmChange}
                            />
                            <span>mm</span>
                        </div>
                    </div>
                </div>

                <div class="zoom-controls">
                    <h3>Zoom</h3>
                    <div class="zoom-buttons">
                        <button
                            onclick={zoomOut}
                            disabled={zoomLevel <= MIN_ZOOM}
                            class="zoom-btn">-</button
                        >
                        <span class="zoom-level"
                            >{Math.round(zoomLevel * 100)}%</span
                        >
                        <button
                            onclick={zoomIn}
                            disabled={zoomLevel >= MAX_ZOOM}
                            class="zoom-btn">+</button
                        >
                        <button onclick={resetZoom} class="zoom-btn reset"
                            >Reset</button
                        >
                    </div>
                </div>
            </div>
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
                class="svg-canvas svg-canvas-end-edge"
                onmousedown={handleMouseDown}
                onmousemove={(e) => {
                    handleMouseMove(e);
                    handleResizeMouseMove(e);
                }}
                onmouseup={handleMouseUp}
                onmouseleave={handleMouseUp}
                onwheel={handleWheelZoom}
                role="application"
                aria-label="End Edge Drawing canvas"
            >
                <!-- Grid background for better positioning -->
                <defs>
                    <marker
                        id="end-arrow-start"
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
                        id="end-arrow-end"
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
                        x1={rectX}
                        y1={rectY - 20}
                        x2={rectX + endEdgeWidthPx}
                        y2={rectY - 20}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#end-arrow-start)"
                        marker-end="url(#end-arrow-end)"
                    />
                    <text
                        x={rectX + endEdgeWidthPx / 2}
                        y={rectY - 30}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                    >
                        {endEdgeWidth} mm
                    </text>
                </g>

                <!-- Height Dimension -->
                <g class="dimension-line">
                    <line
                        x1={rectX - 20}
                        y1={rectY}
                        x2={rectX - 20}
                        y2={rectY + endEdgeHeightPx}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#end-arrow-start)"
                        marker-end="url(#end-arrow-end)"
                    />
                    <text
                        x={rectX - 35}
                        y={rectY + endEdgeHeightPx / 2}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                        transform="rotate(-90, {rectX - 35}, {rectY +
                            endEdgeHeightPx / 2})"
                    >
                        {endEdgeHeight} mm
                    </text>
                </g>

                <!-- Main rectangle -->
                <rect
                    x={rectX}
                    y={rectY}
                    width={endEdgeWidthPx}
                    height={endEdgeHeightPx}
                    fill="white"
                    stroke="#1e1b4b"
                    stroke-width="2"
                    rx="4"
                    class="rectangle"
                />

                <!-- Hole Spacing Dimensions -->
                {#if endEdgeHoleCount > 0}
                    <!-- Left Edge to First Hole -->
                    <g class="dimension-line">
                        <line
                            x1={rectX}
                            y1={rectY + endEdgeHeightPx / 2}
                            x2={rectX + endEdgePitchPx}
                            y2={rectY + endEdgeHeightPx / 2}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#end-arrow-start)"
                            marker-end="url(#end-arrow-end)"
                        />
                        <text
                            x={rectX + endEdgePitchPx / 2}
                            y={rectY + endEdgeHeightPx / 2 - 10}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {endEdgeHoleLeft} mm
                        </text>
                    </g>

                    <!-- Last Hole to Right Edge -->
                    <g class="dimension-line">
                        <line
                            x1={rectX + endEdgeWidthPx - endEdgePitchPx}
                            y1={rectY + endEdgeHeightPx / 2}
                            x2={rectX + endEdgeWidthPx}
                            y2={rectY + endEdgeHeightPx / 2}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#end-arrow-start)"
                            marker-end="url(#end-arrow-end)"
                        />
                        <text
                            x={rectX + endEdgeWidthPx - endEdgePitchPx / 2}
                            y={rectY + endEdgeHeightPx / 2 - 10}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {endEdgeHoleRight} mm
                        </text>
                    </g>
                {/if}

                <!-- Holes -->
                {#each Array(endEdgeHoleCount) as _, i}
                    {@const cx = rectX + (i + 1) * endEdgePitchPx}
                    {@const cy = rectY + endEdgeHeightPx / 2}

                    {#if endEdgeHoleType === "circle"}
                        <circle
                            {cx}
                            {cy}
                            r={endEdgeHoleSizePx / 2}
                            fill="white"
                            stroke="#1e1b4b"
                            stroke-width="1.5"
                        />
                    {:else}
                        <rect
                            x={cx - endEdgeHoleSizePx / 2}
                            y={cy - endEdgeHoleSizePx / 2}
                            width={endEdgeHoleSizePx}
                            height={endEdgeHoleSizePx}
                            fill="white"
                            stroke="#1e1b4b"
                            stroke-width="1.5"
                        />
                    {/if}
                {/each}

                <!-- Hole Diameter Dimension (on top of first hole) -->
                {#if endEdgeHoleCount > 0}
                    {@const firstHoleCx = rectX + endEdgePitchPx}
                    {@const firstHoleCy = rectY + endEdgeHeightPx / 2}
                    {@const dimY = firstHoleCy - endEdgeHoleSizePx / 2 - 15}

                    <g class="dimension-line">
                        <!-- Horizontal dimension line (showing diameter) -->
                        <line
                            x1={firstHoleCx - endEdgeHoleSizePx / 2}
                            y1={dimY}
                            x2={firstHoleCx + endEdgeHoleSizePx / 2}
                            y2={dimY}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#end-arrow-start)"
                            marker-end="url(#end-arrow-end)"
                        />
                        <!-- Extension lines (going up) -->
                        <line
                            x1={firstHoleCx - endEdgeHoleSizePx / 2}
                            y1={firstHoleCy - endEdgeHoleSizePx / 2 - 3}
                            x2={firstHoleCx - endEdgeHoleSizePx / 2}
                            y2={dimY - 5}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={firstHoleCx + endEdgeHoleSizePx / 2}
                            y1={firstHoleCy - endEdgeHoleSizePx / 2 - 3}
                            x2={firstHoleCx + endEdgeHoleSizePx / 2}
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
                            Ø{endEdgeHoleSize} mm
                        </text>
                    </g>
                {/if}

                <!-- Resize handles -->

                <!-- Hole Dimensions -->
                {#if endEdgeHoleCount > 1}
                    {@const firstHoleX = rectX + endEdgePitchPx}
                    {@const secondHoleX = rectX + 2 * endEdgePitchPx}
                    {@const lastHoleX =
                        rectX + endEdgeHoleCount * endEdgePitchPx}
                    {@const holeCenterY = rectY + endEdgeHeightPx / 2}

                    <!-- Top Dimension Position (Pitch) -->
                    {@const dimY_top = holeCenterY - endEdgeHoleSizePx / 2 - 20}

                    <!-- Bottom Dimension Position (Total) -->
                    {@const dimY_bottom =
                        holeCenterY + endEdgeHoleSizePx / 2 + 20}

                    <!-- First to Second Hole (Pitch) - BOTTOM -->
                    <g class="dimension-line">
                        <!-- Extension lines (going down) -->
                        <line
                            x1={firstHoleX}
                            y1={holeCenterY + endEdgeHoleSizePx / 2 + 5}
                            x2={firstHoleX}
                            y2={dimY_bottom + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={secondHoleX}
                            y1={holeCenterY + endEdgeHoleSizePx / 2 + 5}
                            x2={secondHoleX}
                            y2={dimY_bottom + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />

                        <!-- Dimension line -->
                        <line
                            x1={firstHoleX}
                            y1={dimY_bottom}
                            x2={secondHoleX}
                            y2={dimY_bottom}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#end-arrow-start)"
                            marker-end="url(#end-arrow-end)"
                        />
                        <text
                            x={firstHoleX + (secondHoleX - firstHoleX) / 2}
                            y={dimY_bottom + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {endEdgePitch} mm
                        </text>
                    </g>

                    <!-- First to Last Hole (Total) - BOTTOM - Only if more than 2 holes -->
                    {#if endEdgeHoleCount > 2}
                        <g class="dimension-line">
                            <!-- Extension lines (going down) -->
                            <line
                                x1={firstHoleX}
                                y1={holeCenterY + endEdgeHoleSizePx / 2 + 5}
                                x2={firstHoleX}
                                y2={dimY_bottom + 10}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />
                            <line
                                x1={lastHoleX}
                                y1={holeCenterY + endEdgeHoleSizePx / 2 + 5}
                                x2={lastHoleX}
                                y2={dimY_bottom + 10}
                                stroke="#9ca3af"
                                stroke-width="1"
                                stroke-dasharray="4 2"
                            />

                            <!-- Dimension line -->
                            <line
                                x1={firstHoleX}
                                y1={dimY_bottom}
                                x2={lastHoleX}
                                y2={dimY_bottom}
                                stroke="#374151"
                                stroke-width="1.5"
                                marker-start="url(#end-arrow-start)"
                                marker-end="url(#end-arrow-end)"
                            />
                            <text
                                x={firstHoleX + (lastHoleX - firstHoleX) / 2}
                                y={dimY_bottom + 15}
                                fill="#374151"
                                font-size="12"
                                text-anchor="middle"
                            >
                                {endEdgeTotalHoleDistance} mm
                            </text>
                        </g>
                    {/if}
                {/if}
                <circle
                    cx={rectX + endEdgeWidthPx}
                    cy={rectY + endEdgeHeightPx}
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

    .control-panel {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
    }

    .dimension-section,
    .zoom-controls {
        background: #f9fafb;
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .holes-section,
    .mm-labels-section {
        background: #f9fafb;
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .dimension-section h3,
    .zoom-controls h3,
    .holes-section h3,
    .mm-labels-section h3 {
        margin: 0;
        color: #1f2937;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
    }

    .zoom-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .zoom-btn {
        width: 32px;
        height: 32px;
        border: 2px solid #d1d5db;
        background: white;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .zoom-btn:hover:not(:disabled) {
        border-color: #4f46e5;
        background: #4f46e5;
        color: white;
    }

    .zoom-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .zoom-btn.reset {
        width: auto;
        padding: 0 12px;
        font-size: 12px;
        font-weight: 600;
    }

    .zoom-level {
        font-weight: 600;
        color: #1f2937;
        min-width: 50px;
        text-align: center;
        font-size: 14px;
    }

    .input-row {
        display: flex;
        gap: 16px;
        align-items: center;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .control-group.separator {
        border-left: 1px solid #d1d5db;
        padding-left: 16px;
    }

    label {
        font-weight: 500;
        color: #374151;
        font-size: 14px;
    }

    input {
        width: 60px;
        padding: 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        transition: border-color 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
    }

    span {
        color: #6b7280;
        font-size: 12px;
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

    select {
        padding: 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        background: white;
    }
</style>
