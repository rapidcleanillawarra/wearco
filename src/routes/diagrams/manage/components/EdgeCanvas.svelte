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
        onDimensionsChange
    }: {
        width?: number;
        height?: number;
        diagramType?: string;
        onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
    } = $props();

    // Minimum and maximum constraints
    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 150;
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 1500;

    // Reactive canvas dimensions
    let canvasWidth = $state(800);
    let canvasHeight = $state(400);

    // Resize state
    let isResizing = $state(false);
    let resizeHandle = $state<string | null>(null);
    let startDimensions = $state({ width: 0, height: 0 });
    let startMousePos = $state({ x: 0, y: 0 });
    /** Scale from screen pixels to logical (viewBox) units at resize start */
    let resizeScale = $state({ x: 1, y: 1 });

    // Container ref for converting screen deltas to logical dimension deltas
    let canvasContainerEl = $state<HTMLDivElement | null>(null);

    // UI state
    let maintainAspectRatio = $state(false);
    let originalAspectRatio = $state(2.0); // Default aspect ratio
    let showResizeHandles = $state(false);
    let isHoveringCanvas = $state(false);

    // Initialize canvas dimensions from props
    $effect(() => {
        canvasWidth = initialWidth;
        canvasHeight = initialHeight;
        originalAspectRatio = initialWidth / initialHeight;
    });

    // Input field state (synced from logical dimensions in effect below)
    let widthInputValue = $state('800');
    let heightInputValue = $state('400');

    $effect(() => {
        widthInputValue = canvasWidth.toString();
        heightInputValue = canvasHeight.toString();
    });

    // Diagram dimensions and styling (scaled relative to canvas size)
    const diagramDimensions = $derived.by(() => {
        const scale = Math.min(canvasWidth / 800, canvasHeight / 400);
        return {
            rectangleWidth: Math.max(150, 200 * scale),
            rectangleHeight: Math.max(200, 300 * scale),
            circleRadius: Math.max(12, 20 * scale)
        };
    });

    // Reactive calculations for positions
    const rectangleX = $derived.by(() => {
        const { rectangleWidth } = diagramDimensions;
        return (canvasWidth - rectangleWidth) / 2;
    });

    const rectangleY = $derived.by(() => {
        const { rectangleHeight } = diagramDimensions;
        return (canvasHeight - rectangleHeight) / 2;
    });

    const circleY = $derived.by(() => {
        const { rectangleHeight } = diagramDimensions;
        return rectangleY + rectangleHeight / 2;
    });

    const circlePositions = $derived.by(() => {
        const { rectangleWidth } = diagramDimensions;
        const horizontalSpacing = rectangleWidth / 4; // Divide into 4 equal parts

        // Circle X positions: left, center, right
        return [
            rectangleX + horizontalSpacing,         // First circle
            rectangleX + horizontalSpacing * 2,     // Second circle (center)
            rectangleX + horizontalSpacing * 3      // Third circle
        ];
    });

    // Notify parent of dimension changes
    $effect(() => {
        if (onDimensionsChange) {
            onDimensionsChange({ width: canvasWidth, height: canvasHeight });
        }
    });

    // Validation and constraint functions
    function validateAndConstrainDimension(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Math.round(value)));
    }

    function updateCanvasDimensions(newWidth: number, newHeight: number) {
        canvasWidth = validateAndConstrainDimension(newWidth, MIN_WIDTH, MAX_WIDTH);
        canvasHeight = validateAndConstrainDimension(newHeight, MIN_HEIGHT, MAX_HEIGHT);
    }

    // Canvas resize functions (deltas are in screen pixels; convert to logical units via container scale)
    function startResize(handle: string, event: MouseEvent) {
        isResizing = true;
        resizeHandle = handle;
        startDimensions = { width: canvasWidth, height: canvasHeight };
        startMousePos = { x: event.clientX, y: event.clientY };

        if (canvasContainerEl) {
            const rect = canvasContainerEl.getBoundingClientRect();
            resizeScale = {
                x: rect.width / canvasWidth,
                y: rect.height / canvasHeight
            };
        } else {
            resizeScale = { x: 1, y: 1 };
        }

        event.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = getCursorForHandle(handle);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing || !resizeHandle) return;

        const pixelDeltaX = event.clientX - startMousePos.x;
        const pixelDeltaY = event.clientY - startMousePos.y;
        const deltaX = resizeScale.x !== 0 ? pixelDeltaX / resizeScale.x : pixelDeltaX;
        const deltaY = resizeScale.y !== 0 ? pixelDeltaY / resizeScale.y : pixelDeltaY;

        let newWidth = startDimensions.width;
        let newHeight = startDimensions.height;

        switch (resizeHandle) {
            case 'se':
                newWidth = startDimensions.width + deltaX;
                newHeight = startDimensions.height + deltaY;
                break;
            case 'sw':
                newWidth = startDimensions.width - deltaX;
                newHeight = startDimensions.height + deltaY;
                break;
            case 'ne':
                newWidth = startDimensions.width + deltaX;
                newHeight = startDimensions.height - deltaY;
                break;
            case 'nw':
                newWidth = startDimensions.width - deltaX;
                newHeight = startDimensions.height - deltaY;
                break;
            case 'e':
                newWidth = startDimensions.width + deltaX;
                break;
            case 'w':
                newWidth = startDimensions.width - deltaX;
                break;
            case 's':
                newHeight = startDimensions.height + deltaY;
                break;
            case 'n':
                newHeight = startDimensions.height - deltaY;
                break;
        }

        if (maintainAspectRatio && (resizeHandle === 'se' || resizeHandle === 'nw')) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / originalAspectRatio;
            } else {
                newWidth = newHeight * originalAspectRatio;
            }
        }

        updateCanvasDimensions(newWidth, newHeight);
    }

    function stopResize() {
        if (isResizing) {
            isResizing = false;
            resizeHandle = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }

    const RESIZE_CURSORS: Record<string, string> = {
        'se': 'nw-resize',
        'sw': 'ne-resize',
        'ne': 'sw-resize',
        'nw': 'se-resize',
        'e': 'e-resize',
        'w': 'w-resize',
        's': 's-resize',
        'n': 'n-resize'
    };

    function getCursorForHandle(handle: string): string {
        return RESIZE_CURSORS[handle] ?? 'default';
    }

    // Input field handlers
    function handleWidthInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value) || canvasWidth;
        updateCanvasDimensions(value, canvasHeight);
    }

    function handleHeightInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value) || canvasHeight;
        updateCanvasDimensions(canvasWidth, value);
    }

    // Keyboard shortcuts
    function handleKeydown(event: KeyboardEvent) {
        if (event.target instanceof HTMLInputElement) return; // Don't interfere with input fields

        const step = event.shiftKey ? 50 : 10; // Larger steps with shift

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                updateCanvasDimensions(canvasWidth, canvasHeight - step);
                break;
            case 'ArrowDown':
                event.preventDefault();
                updateCanvasDimensions(canvasWidth, canvasHeight + step);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                updateCanvasDimensions(canvasWidth - step, canvasHeight);
                break;
            case 'ArrowRight':
                event.preventDefault();
                updateCanvasDimensions(canvasWidth + step, canvasHeight);
                break;
            case 'r':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    updateCanvasDimensions(initialWidth, initialHeight);
                }
                break;
        }
    }

    // Aspect ratio toggle
    function toggleAspectRatio() {
        maintainAspectRatio = !maintainAspectRatio;
        if (maintainAspectRatio) {
            originalAspectRatio = canvasWidth / canvasHeight;
        }
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
                    class="aspect-ratio-toggle {maintainAspectRatio ? 'active' : ''}"
                    onclick={toggleAspectRatio}
                    title="Maintain aspect ratio during resize"
                    aria-label="Toggle aspect ratio lock"
                >
                    🔒
                </button>
            </div>
            <div class="reset-controls">
                <button
                    class="reset-button"
                    onclick={() => updateCanvasDimensions(initialWidth, initialHeight)}
                    title="Reset to original dimensions (Ctrl+R)"
                >
                    Reset
                </button>
            </div>
        </div>
    </div>

    <div
        bind:this={canvasContainerEl}
        class="svg-canvas-container"
        class:hovering={isHoveringCanvas}
        onmouseenter={() => isHoveringCanvas = true}
        onmouseleave={() => isHoveringCanvas = false}
        onmousemove={handleMouseMove}
        onmouseup={stopResize}
        onkeydown={handleKeydown}
        tabindex="0"
        role="application"
        aria-label="Interactive diagram canvas with resize handles"
    >
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 {canvasWidth} {canvasHeight}"
            preserveAspectRatio="xMidYMid meet"
            class="svg-canvas"
            role="img"
            aria-label="Interactive diagram display showing a rectangle with three circles"
        >
            <!-- Subtle grid background for better visualization -->
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Main vertical rectangle -->
            <rect
                x={rectangleX}
                y={rectangleY}
                width={diagramDimensions.rectangleWidth}
                height={diagramDimensions.rectangleHeight}
                fill="none"
                stroke="#3b82f6"
                stroke-width="3"
                rx="8"
                ry="8"
            />

            <!-- Three evenly spaced circles -->
            {#each circlePositions as circleX, index}
                <circle
                    cx={circleX}
                    cy={circleY}
                    r={diagramDimensions.circleRadius}
                    fill="#10b981"
                    stroke="#059669"
                    stroke-width="2"
                />
            {/each}

            <!-- Resize handles (only visible when hovering or resizing) -->
            {#if isHoveringCanvas || isResizing}
                <!-- Corner handles -->
                <circle
                    cx="0"
                    cy="0"
                    r="6"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="2"
                    class="resize-handle nw"
                    onmousedown={(e) => startResize('nw', e)}
                    style="cursor: nw-resize"
                />
                <circle
                    cx={canvasWidth}
                    cy="0"
                    r="6"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="2"
                    class="resize-handle ne"
                    onmousedown={(e) => startResize('ne', e)}
                    style="cursor: ne-resize"
                />
                <circle
                    cx="0"
                    cy={canvasHeight}
                    r="6"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="2"
                    class="resize-handle sw"
                    onmousedown={(e) => startResize('sw', e)}
                    style="cursor: sw-resize"
                />
                <circle
                    cx={canvasWidth}
                    cy={canvasHeight}
                    r="6"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="2"
                    class="resize-handle se"
                    onmousedown={(e) => startResize('se', e)}
                    style="cursor: se-resize"
                />

                <!-- Edge handles -->
                <rect
                    x={canvasWidth / 2 - 10}
                    y="-5"
                    width="20"
                    height="10"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="1"
                    rx="2"
                    class="resize-handle n"
                    onmousedown={(e) => startResize('n', e)}
                    style="cursor: n-resize"
                />
                <rect
                    x={canvasWidth / 2 - 10}
                    y={canvasHeight - 5}
                    width="20"
                    height="10"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="1"
                    rx="2"
                    class="resize-handle s"
                    onmousedown={(e) => startResize('s', e)}
                    style="cursor: s-resize"
                />
                <rect
                    x="-5"
                    y={canvasHeight / 2 - 10}
                    width="10"
                    height="20"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="1"
                    rx="2"
                    class="resize-handle w"
                    onmousedown={(e) => startResize('w', e)}
                    style="cursor: w-resize"
                />
                <rect
                    x={canvasWidth - 5}
                    y={canvasHeight / 2 - 10}
                    width="10"
                    height="20"
                    fill="#3b82f6"
                    stroke="white"
                    stroke-width="1"
                    rx="2"
                    class="resize-handle e"
                    onmousedown={(e) => startResize('e', e)}
                    style="cursor: e-resize"
                />
            {/if}

            <!-- Dimension display during resize -->
            {#if isResizing}
                <text
                    x={canvasWidth / 2}
                    y="30"
                    text-anchor="middle"
                    fill="#3b82f6"
                    font-size="14"
                    font-weight="bold"
                    class="dimension-display"
                >
                    {canvasWidth} × {canvasHeight}
                </text>
            {/if}
        </svg>

        <!-- Canvas overlay for dimension display when not resizing -->
        {#if !isResizing && isHoveringCanvas}
            <div class="canvas-overlay">
                <div class="dimension-tooltip">
                    {canvasWidth} × {canvasHeight} px
                </div>
            </div>
        {/if}
    </div>

    <div class="canvas-info">
        <p>Interactive diagram canvas • Drag corners/edges to resize • Use input fields or keyboard shortcuts (arrow keys, Ctrl+R to reset)</p>
    </div>
</div>

<style>
    .diagram-canvas-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 1.5rem;
        height: 100%;
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
        gap: 0.5rem;
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

    .svg-canvas-container {
        flex: 1;
        min-height: 400px;
        background: #ffffff;
        border-radius: 0.375rem;
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
</style>