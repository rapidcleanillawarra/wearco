<script lang="ts">
    // Enhanced Diagram Canvas Component with content scaling (viewBox)
    // Displays a vertically-oriented rectangle with three evenly-spaced circles.
    // Dimension controls adjust the drawing's logical size (viewBox); the canvas
    // container keeps layout-appropriate dimensions and the SVG scales content to fit.

    // Props
    let {
        width: initialWidth = 800,
        height: initialHeight = 400,
        diagramType = "Edge Diagram",
        onDimensionsChange,
    }: {
        width?: number;
        height?: number;
        diagramType?: string;
        onDimensionsChange?: (dimensions: {
            width: number;
            height: number;
        }) => void;
    } = $props();

    // Minimum and maximum constraints
    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 150;
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 1500;

    // Reactive rectangle dimensions
    let rectWidth = $state(initialWidth);
    let rectHeight = $state(initialHeight);

    // Padding around the rectangle within the SVG viewport
    const CANVAS_PADDING = 80;

    // Pan state
    let panOffset = $state({ x: 0, y: 0 });

    // Viewport dimensions (reactive to content size)
    const canvasWidth = $derived(rectWidth + CANVAS_PADDING * 2);
    const canvasHeight = $derived(rectHeight + CANVAS_PADDING * 2);

    // Positions (centered by reactive viewport size + pan)
    const rectangleX = $derived(CANVAS_PADDING + panOffset.x);
    const rectangleY = $derived(CANVAS_PADDING + panOffset.y);
    const circleY = $derived(rectangleY + rectHeight / 2);

    const circlePositions = $derived.by(() => {
        const horizontalSpacing = rectWidth / 4;
        return [
            rectangleX + horizontalSpacing,
            rectangleX + horizontalSpacing * 2,
            rectangleX + horizontalSpacing * 3,
        ];
    });

    // Interaction state
    let isResizing = $state(false);
    let isDragging = $state(false);
    let resizeHandle = $state<string | null>(null);
    let startDimensions = $state({ width: 0, height: 0 });
    let startMousePos = $state({ x: 0, y: 0 });
    let startPanOffset = $state({ x: 0, y: 0 });
    let resizeScale = $state({ x: 1, y: 1 });

    // Zoom functionality
    let zoomLevel = $state(1);
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.1;

    function zoomIn() {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
    }

    function zoomOut() {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
    }

    function resetZoom() {
        zoomLevel = 1;
    }

    function resetView() {
        zoomLevel = 1;
        panOffset = { x: 0, y: 0 };
    }

    function handleWheelZoom(event: WheelEvent) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.deltaY < 0) zoomIn();
            else zoomOut();
        }
    }

    // Container ref
    let canvasContainerEl = $state<HTMLDivElement | null>(null);
    let svgEl = $state<SVGSVGElement | null>(null);

    // UI state
    let maintainAspectRatio = $state(false);
    let originalAspectRatio = $state(initialWidth / initialHeight);
    let showResizeHandles = $state(false);
    let isHoveringCanvas = $state(false);

    // Initialize dimensions from props
    $effect(() => {
        rectWidth = initialWidth;
        rectHeight = initialHeight;
        originalAspectRatio = initialWidth / initialHeight;
    });

    // Input field state
    let widthInputValue = $state(initialWidth.toString());
    let heightInputValue = $state(initialHeight.toString());

    $effect(() => {
        widthInputValue = rectWidth.toString();
        heightInputValue = rectHeight.toString();
    });

    // Diagram elements sizes
    const diagramStyles = $derived.by(() => {
        const scale = Math.min(rectWidth / 800, rectHeight / 400);
        const radius = Math.max(12, 20 * scale);
        const spacing = rectWidth / 4;

        return {
            circleRadius: radius,
            holeDiameter: Math.round(radius * 2), // mm
            pitch: Math.round(spacing), // mm
            edgeDistance: Math.round(spacing), // mm
            totalDistance: Math.round(spacing * 2), // mm
        };
    });

    // Notify parent of dimension changes
    $effect(() => {
        if (onDimensionsChange) {
            onDimensionsChange({ width: rectWidth, height: rectHeight });
        }
    });

    // Validation and constraint functions
    function validateAndConstrainDimension(
        value: number,
        min: number,
        max: number,
    ): number {
        return Math.max(min, Math.min(max, Math.round(value)));
    }

    function updateRectangleDimensions(newWidth: number, newHeight: number) {
        rectWidth = validateAndConstrainDimension(
            newWidth,
            MIN_WIDTH,
            MAX_WIDTH,
        );
        rectHeight = validateAndConstrainDimension(
            newHeight,
            MIN_HEIGHT,
            MAX_HEIGHT,
        );
    }

    // Canvas resize functions (deltas are in screen pixels; convert to logical units via container scale)
    function startResize(handle: string, event: MouseEvent) {
        event.stopPropagation(); // Prevent drag from starting
        isResizing = true;
        resizeHandle = handle;
        startDimensions = { width: rectWidth, height: rectHeight };
        startMousePos = { x: event.clientX, y: event.clientY };

        if (canvasContainerEl) {
            const rect = canvasContainerEl.getBoundingClientRect();
            // account for both SVG viewBox mapping and UI zoomLevel
            resizeScale = {
                x: (rect.width * zoomLevel) / canvasWidth,
                y: (rect.height * zoomLevel) / canvasHeight,
            };
        } else {
            resizeScale = { x: 1, y: 1 };
        }

        event.preventDefault();
        document.body.style.userSelect = "none";
        document.body.style.cursor = getCursorForHandle(handle);
    }

    function startDragging(event: MouseEvent) {
        if (isResizing) return;
        isDragging = true;
        startMousePos = { x: event.clientX, y: event.clientY };
        startPanOffset = { ...panOffset };

        if (canvasContainerEl) {
            const rect = canvasContainerEl.getBoundingClientRect();
            resizeScale = {
                x: (rect.width * zoomLevel) / canvasWidth,
                y: (rect.height * zoomLevel) / canvasHeight,
            };
        } else {
            resizeScale = { x: 1, y: 1 };
        }

        event.preventDefault();
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
    }

    function handleMouseMove(event: MouseEvent) {
        if (isDragging) {
            const pixelDeltaX = event.clientX - startMousePos.x;
            const pixelDeltaY = event.clientY - startMousePos.y;
            const deltaX =
                resizeScale.x !== 0 ? pixelDeltaX / resizeScale.x : pixelDeltaX;
            const deltaY =
                resizeScale.y !== 0 ? pixelDeltaY / resizeScale.y : pixelDeltaY;

            panOffset = {
                x: startPanOffset.x + deltaX,
                y: startPanOffset.y + deltaY,
            };
            return;
        }

        if (!isResizing || !resizeHandle) return;

        const pixelDeltaX = event.clientX - startMousePos.x;
        const pixelDeltaY = event.clientY - startMousePos.y;
        const deltaX =
            resizeScale.x !== 0 ? pixelDeltaX / resizeScale.x : pixelDeltaX;
        const deltaY =
            resizeScale.y !== 0 ? pixelDeltaY / resizeScale.y : pixelDeltaY;

        let newWidth = startDimensions.width;
        let newHeight = startDimensions.height;

        switch (resizeHandle) {
            case "se":
                newWidth = startDimensions.width + deltaX;
                newHeight = startDimensions.height + deltaY;
                break;
            case "sw":
                newWidth = startDimensions.width - deltaX;
                newHeight = startDimensions.height + deltaY;
                break;
            case "ne":
                newWidth = startDimensions.width + deltaX;
                newHeight = startDimensions.height - deltaY;
                break;
            case "nw":
                newWidth = startDimensions.width - deltaX;
                newHeight = startDimensions.height - deltaY;
                break;
            case "e":
                newWidth = startDimensions.width + deltaX;
                break;
            case "w":
                newWidth = startDimensions.width - deltaX;
                break;
            case "s":
                newHeight = startDimensions.height + deltaY;
                break;
            case "n":
                newHeight = startDimensions.height - deltaY;
                break;
        }

        if (
            maintainAspectRatio &&
            (resizeHandle === "se" || resizeHandle === "nw")
        ) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / originalAspectRatio;
            } else {
                newWidth = newHeight * originalAspectRatio;
            }
        }

        updateRectangleDimensions(newWidth, newHeight);
    }

    function stopResize() {
        if (isResizing || isDragging) {
            isResizing = false;
            isDragging = false;
            resizeHandle = null;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }
    }

    const RESIZE_CURSORS: Record<string, string> = {
        se: "nw-resize",
        sw: "ne-resize",
        ne: "sw-resize",
        nw: "se-resize",
        e: "e-resize",
        w: "w-resize",
        s: "s-resize",
        n: "n-resize",
    };

    function getCursorForHandle(handle: string): string {
        return RESIZE_CURSORS[handle] ?? "default";
    }

    // Input field handlers
    function handleWidthInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value) || rectWidth;
        updateRectangleDimensions(value, rectHeight);
    }

    function handleHeightInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value) || rectHeight;
        updateRectangleDimensions(rectWidth, value);
    }

    // Keyboard shortcuts
    function handleKeydown(event: KeyboardEvent) {
        if (event.target instanceof HTMLInputElement) return; // Don't interfere with input fields

        const step = event.shiftKey ? 50 : 10; // Larger steps with shift

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                updateRectangleDimensions(rectWidth, rectHeight - step);
                break;
            case "ArrowDown":
                event.preventDefault();
                updateRectangleDimensions(rectWidth, rectHeight + step);
                break;
            case "ArrowLeft":
                event.preventDefault();
                updateRectangleDimensions(rectWidth - step, rectHeight);
                break;
            case "ArrowRight":
                event.preventDefault();
                updateRectangleDimensions(rectWidth + step, rectHeight);
                break;
            case "r":
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    updateRectangleDimensions(initialWidth, initialHeight);
                }
                break;
        }
    }

    // Aspect ratio toggle
    function toggleAspectRatio() {
        maintainAspectRatio = !maintainAspectRatio;
        if (maintainAspectRatio) {
            originalAspectRatio = rectWidth / rectHeight;
        }
    }

    // SVG Export logic
    function exportSvg() {
        if (!svgEl) return;

        // Clone the SVG to manipulate it without affecting the UI
        const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;

        // Remove non-exportable UI elements from the clone
        const gridRect = clonedSvg.querySelector('rect[fill="url(#grid)"]');
        if (gridRect) gridRect.remove();

        const handles = clonedSvg.querySelectorAll(".resize-handle");
        handles.forEach((h) => (h as SVGElement).remove());

        const dimDisplay = clonedSvg.querySelector(".dimension-display");
        if (dimDisplay) dimDisplay.remove();

        // Reset zoom for export to ensure 1:1 scale
        const contentGroup = clonedSvg.querySelector('g[style*="transform"]');
        if (contentGroup) {
            (contentGroup as SVGGElement).style.transform = "";
            (contentGroup as SVGGElement).style.transformOrigin = "";
        }

        // Ensure the cloned SVG has the correct xmlns
        clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // Add a white background rect to the export
        const bgRect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
        );
        bgRect.setAttribute("width", "100%");
        bgRect.setAttribute("height", "100%");
        bgRect.setAttribute("fill", "white");
        clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

        // Serialize the SVG to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);

        // Create a blob and trigger download
        const blob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${diagramType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>

<div class="diagram-canvas-container">
    <div class="canvas-header">
        <h3>{diagramType} Preview</h3>
        <div class="canvas-controls">
            <div class="dimension-controls">
                <label class="control-group">
                    <span class="control-label">Width:</span>
                    <input
                        type="number"
                        bind:value={widthInputValue}
                        oninput={handleWidthInput}
                        min={MIN_WIDTH}
                        max={MAX_WIDTH}
                        class="dimension-input"
                        placeholder="Width"
                    />
                    <span class="unit">px</span>
                </label>
                <label class="control-group">
                    <span class="control-label">Height:</span>
                    <input
                        type="number"
                        bind:value={heightInputValue}
                        oninput={handleHeightInput}
                        min={MIN_HEIGHT}
                        max={MAX_HEIGHT}
                        class="dimension-input"
                        placeholder="Height"
                    />
                    <span class="unit">px</span>
                </label>
                <button
                    type="button"
                    class="aspect-ratio-toggle {maintainAspectRatio
                        ? 'active'
                        : ''}"
                    onclick={toggleAspectRatio}
                    title="Maintain aspect ratio during resize"
                    aria-label="Toggle aspect ratio lock"
                >
                    🔒
                </button>
            </div>
            <div class="reset-controls">
                <div class="zoom-controls">
                    <button
                        type="button"
                        class="zoom-btn"
                        onclick={zoomOut}
                        title="Zoom Out"
                        aria-label="Zoom Out"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            ><line x1="5" y1="12" x2="19" y2="12" /></svg
                        >
                    </button>
                    <span class="zoom-text">{Math.round(zoomLevel * 100)}%</span
                    >
                    <button
                        type="button"
                        class="zoom-btn"
                        onclick={zoomIn}
                        title="Zoom In"
                        aria-label="Zoom In"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            ><line x1="12" y1="5" x2="12" y2="19" /><line
                                x1="5"
                                y1="12"
                                x2="19"
                                y2="12"
                            /></svg
                        >
                    </button>
                    <button
                        type="button"
                        class="zoom-btn reset-zoom"
                        onclick={resetZoom}
                        title="Reset Zoom"
                        aria-label="Reset Zoom"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            ><path
                                d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                            /><path d="M3 3v5h5" /></svg
                        >
                    </button>
                </div>
                <button
                    type="button"
                    class="reset-button"
                    onclick={() =>
                        updateRectangleDimensions(initialWidth, initialHeight)}
                    title="Reset to original dimensions (Ctrl+R)"
                >
                    Reset
                </button>
                <button
                    type="button"
                    class="export-button"
                    onclick={exportSvg}
                    title="Export diagram as SVG file"
                    aria-label="Export SVG"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export SVG
                </button>
            </div>
        </div>
    </div>

    <div
        bind:this={canvasContainerEl}
        class="svg-canvas-container"
        class:hovering={isHoveringCanvas}
        onmouseenter={() => (isHoveringCanvas = true)}
        onmouseleave={() => (isHoveringCanvas = false)}
        onmousemove={handleMouseMove}
        onmouseup={stopResize}
        onkeydown={handleKeydown}
        onwheel={handleWheelZoom}
        tabindex="0"
        role="application"
        aria-label="Interactive diagram canvas with resize handles"
    >
        <svg
            bind:this={svgEl}
            width="100%"
            height="100%"
            viewBox="0 0 {canvasWidth} {canvasHeight}"
            preserveAspectRatio="xMidYMid meet"
            class="svg-canvas"
            role="img"
            aria-label="Interactive diagram display"
        >
            <defs>
                <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#f1f5f9"
                        stroke-width="0.5"
                    />
                </pattern>
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
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Zoomable Content Group -->
            <g style="transform: scale({zoomLevel}); transform-origin: center;">
                <!-- Width Dimension Line -->
                <g class="dimension-line">
                    <line
                        x1={rectangleX + 5}
                        y1={rectangleY - 20}
                        x2={rectangleX + rectWidth - 5}
                        y2={rectangleY - 20}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#arrow-start)"
                        marker-end="url(#arrow-end)"
                    />
                    <text
                        x={rectangleX + rectWidth / 2}
                        y={rectangleY - 30}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                    >
                        {rectWidth} mm
                    </text>
                </g>

                <!-- Height Dimension Line -->
                <g class="dimension-line">
                    <line
                        x1={rectangleX - 20}
                        y1={rectangleY + 5}
                        x2={rectangleX - 20}
                        y2={rectangleY + rectHeight - 5}
                        stroke="#374151"
                        stroke-width="1.5"
                        marker-start="url(#arrow-start)"
                        marker-end="url(#arrow-end)"
                    />
                    <text
                        x={rectangleX - 35}
                        y={rectangleY + rectHeight / 2}
                        fill="#374151"
                        font-size="12"
                        text-anchor="middle"
                        transform="rotate(-90, {rectangleX - 35}, {rectangleY +
                            rectHeight / 2})"
                    >
                        {rectHeight} mm
                    </text>
                </g>

                <!-- Main Rectangle -->
                <rect
                    x={rectangleX}
                    y={rectangleY}
                    width={rectWidth}
                    height={rectHeight}
                    fill="white"
                    stroke="#1e1b4b"
                    stroke-width="2"
                    rx="4"
                    ry="4"
                    class="main-rectangle"
                    onmousedown={startDragging}
                    role="button"
                    tabindex="-1"
                    aria-label="Drawing area"
                    aria-roledescription="draggable"
                    style="cursor: grab"
                />

                <!-- Three centered circles -->
                {#each circlePositions as circleX}
                    <circle
                        cx={circleX}
                        cy={circleY}
                        r={diagramStyles.circleRadius}
                        fill="white"
                        stroke="#1e1b4b"
                        stroke-width="1.5"
                    />
                {/each}

                <!-- Hole Diameter Dimension (above first hole) -->
                {#if true}
                    {@const firstHoleX = circlePositions[0]}
                    {@const lastHoleX = circlePositions[2]}
                    {@const holeRadius = diagramStyles.circleRadius}
                    {@const dimY_hole = circleY - holeRadius - 25}

                    <g class="dimension-line">
                        <line
                            x1={firstHoleX - holeRadius + 3}
                            y1={dimY_hole}
                            x2={firstHoleX + holeRadius - 3}
                            y2={dimY_hole}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <!-- Extension lines -->
                        <line
                            x1={firstHoleX - holeRadius}
                            y1={circleY - holeRadius - 5}
                            x2={firstHoleX - holeRadius}
                            y2={dimY_hole - 5}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={firstHoleX + holeRadius}
                            y1={circleY - holeRadius - 5}
                            x2={firstHoleX + holeRadius}
                            y2={dimY_hole - 5}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <text
                            x={firstHoleX}
                            y={dimY_hole - 8}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            Ø{diagramStyles.holeDiameter} mm
                        </text>
                    </g>

                    <!-- Pitch and Total Distance Dimensions (below holes) -->
                    {@const dimY_pitch = circleY + holeRadius + 25}
                    {@const dimY_total = dimY_pitch + 40}

                    <!-- Pitch (Hole 1 to Hole 2) -->
                    <g class="dimension-line">
                        <line
                            x1={circlePositions[0] + 5}
                            y1={dimY_pitch}
                            x2={circlePositions[1] - 5}
                            y2={dimY_pitch}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <!-- Extension lines for pitch -->
                        <line
                            x1={circlePositions[0]}
                            y1={circleY + holeRadius + 5}
                            x2={circlePositions[0]}
                            y2={dimY_pitch + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={circlePositions[1]}
                            y1={circleY + holeRadius + 5}
                            x2={circlePositions[1]}
                            y2={dimY_pitch + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <text
                            x={(circlePositions[0] + circlePositions[1]) / 2}
                            y={dimY_pitch + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {diagramStyles.pitch} mm
                        </text>
                    </g>

                    <!-- Left Edge Distance (Left Line to Hole 1) -->
                    <g class="dimension-line">
                        <line
                            x1={rectangleX + 3}
                            y1={dimY_pitch}
                            x2={circlePositions[0] - 5}
                            y2={dimY_pitch}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <!-- Extension lines for edge distance -->
                        <line
                            x1={rectangleX}
                            y1={rectangleY + rectHeight}
                            x2={rectangleX}
                            y2={dimY_pitch + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <text
                            x={(rectangleX + circlePositions[0]) / 2}
                            y={dimY_pitch + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {diagramStyles.edgeDistance} mm
                        </text>
                    </g>

                    <!-- Right Edge Distance (Hole 3 to Right Line) -->
                    <g class="dimension-line">
                        <line
                            x1={circlePositions[2] + 5}
                            y1={dimY_pitch}
                            x2={rectangleX + rectWidth - 3}
                            y2={dimY_pitch}
                            stroke="#374151"
                            stroke-width="1.5"
                            marker-start="url(#arrow-start)"
                            marker-end="url(#arrow-end)"
                        />
                        <!-- Extension lines for edge distance -->
                        <line
                            x1={rectangleX + rectWidth}
                            y1={rectangleY + rectHeight}
                            x2={rectangleX + rectWidth}
                            y2={dimY_pitch + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <text
                            x={(circlePositions[2] + (rectangleX + rectWidth)) /
                                2}
                            y={dimY_pitch + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {diagramStyles.edgeDistance} mm
                        </text>
                    </g>

                    <!-- Total Hole Distance (Hole 1 to Last Hole) -->
                    <g class="dimension-line">
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
                        <!-- Extension lines for total distance -->
                        <line
                            x1={firstHoleX}
                            y1={circleY + holeRadius + 5}
                            x2={firstHoleX}
                            y2={dimY_total + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <line
                            x1={lastHoleX}
                            y1={circleY + holeRadius + 5}
                            x2={lastHoleX}
                            y2={dimY_total + 10}
                            stroke="#9ca3af"
                            stroke-width="1"
                            stroke-dasharray="4 2"
                        />
                        <text
                            x={(firstHoleX + lastHoleX) / 2}
                            y={dimY_total + 15}
                            fill="#374151"
                            font-size="12"
                            text-anchor="middle"
                        >
                            {diagramStyles.totalDistance} mm
                        </text>
                    </g>
                {/if}

                <!-- Resize handles attached to the rectangle -->
                {#if isHoveringCanvas || isResizing}
                    <!-- Bottom-Right Corner Handle (Red as in reference) -->
                    <circle
                        cx={rectangleX + rectWidth}
                        cy={rectangleY + rectHeight}
                        r="8"
                        fill="#ef4444"
                        stroke="white"
                        stroke-width="2"
                        class="resize-handle se"
                        onmousedown={(e) => startResize("se", e)}
                        style="cursor: se-resize"
                    />

                    <!-- Other handles (subtle blue) -->
                    <circle
                        cx={rectangleX}
                        cy={rectangleY}
                        r="5"
                        fill="#3b82f6"
                        stroke="white"
                        stroke-width="1.5"
                        class="resize-handle nw"
                        onmousedown={(e) => startResize("nw", e)}
                        style="cursor: nw-resize"
                    />
                {/if}
            </g>

            <!-- Dimension display during resize -->
            {#if isResizing}
                <text
                    x={canvasWidth / 2}
                    y={canvasHeight - 20}
                    text-anchor="middle"
                    fill="#3b82f6"
                    font-size="14"
                    font-weight="bold"
                    class="dimension-display"
                >
                    {rectWidth} × {rectHeight} mm
                </text>
            {/if}
        </svg>

        <!-- Canvas overlay for dimension display when not resizing -->
        {#if !isResizing && isHoveringCanvas}
            <div class="canvas-overlay">
                <div class="dimension-tooltip">
                    {rectWidth} × {rectHeight} mm
                </div>
            </div>
        {/if}
    </div>

    <div class="canvas-info">
        <p>
            Interactive diagram canvas • Drag corners to resize • <b
                >Ctrl + Scroll</b
            > to zoom • Use input fields or keyboard shortcuts (arrow keys, Ctrl+R
            to reset)
        </p>
    </div>
</div>

<style>
    .diagram-canvas-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 1rem;
        height: auto;
    }

    .canvas-header {
        padding-bottom: 1rem;
        border-bottom: 1px solid #334155;
    }

    .canvas-header h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
    }

    .canvas-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .dimension-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        padding: 0.5rem;
    }

    .control-label {
        font-size: 0.875rem;
        color: #cbd5e1;
        font-weight: 500;
        white-space: nowrap;
    }

    .dimension-input {
        width: 80px;
        padding: 0.25rem 0.5rem;
        background: #0f172a;
        border: 1px solid #475569;
        border-radius: 0.25rem;
        color: #f8fafc;
        font-size: 0.875rem;
        text-align: center;
    }

    .dimension-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .dimension-input:invalid {
        border-color: #ef4444;
    }

    .unit {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
    }

    .aspect-ratio-toggle {
        padding: 0.5rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    .aspect-ratio-toggle:hover {
        background: #334155;
        border-color: #475569;
    }

    .aspect-ratio-toggle.active {
        background: #1e40af;
        border-color: #3b82f6;
        color: #f8fafc;
    }

    .reset-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .zoom-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #1e293b;
        border: 1px solid #334155;
        padding: 0.25rem;
        border-radius: 0.375rem;
    }

    .zoom-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        border-radius: 0.25rem;
        transition: all 0.2s;
    }

    .zoom-btn:hover {
        background: #334155;
        color: #cbd5e1;
    }

    .zoom-text {
        font-size: 0.8rem;
        color: #cbd5e1;
        min-width: 4ch;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    .reset-button {
        padding: 0.5rem 1rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        color: #cbd5e1;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .reset-button:hover {
        background: #334155;
        border-color: #475569;
    }

    .export-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #1e40af;
        border: 1px solid #3b82f6;
        border-radius: 0.375rem;
        color: #f8fafc;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .export-button:hover {
        background: #1d4ed8;
        border-color: #60a5fa;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .export-button svg {
        flex-shrink: 0;
    }

    .svg-canvas-container {
        flex: 1;
        min-height: 250px;
        background: #ffffff;
        border-radius: 0.375rem;
        max-height: 500px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        position: relative;
        cursor: default;
        transition: border-color 0.2s ease;
    }

    .svg-canvas-container.hovering {
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .svg-canvas {
        display: block;
        width: 100%;
        height: 100%;
        background: #ffffff;
        user-select: none;
    }

    .resize-handle {
        cursor: pointer !important;
        transition: all 0.2s ease;
        pointer-events: all;
    }

    .resize-handle:hover {
        fill: #1d4ed8;
        stroke-width: 3;
    }

    .canvas-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        pointer-events: none;
    }

    .dimension-tooltip {
        background: rgba(15, 23, 42, 0.9);
        color: #f8fafc;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        margin-top: 1rem;
        border: 1px solid #334155;
        backdrop-filter: blur(8px);
    }

    .dimension-display {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .canvas-info {
        text-align: center;
        padding-top: 1rem;
        border-top: 1px solid #334155;
    }

    .canvas-info p {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
    }

    /* Prevent text selection during resize */
    .svg-canvas-container :global(*) {
        user-select: none;
    }

    /* Focus styles for keyboard navigation */
    .svg-canvas-container:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }

    .main-rectangle {
        transition: stroke 0.2s ease;
    }

    .main-rectangle:hover {
        stroke: #3b82f6;
    }

    :global(body[style*="grabbing"]) .main-rectangle {
        cursor: grabbing !important;
    }
</style>
