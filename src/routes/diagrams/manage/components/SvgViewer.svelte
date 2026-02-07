<script lang="ts">
    // SVG Viewer Component with Rectangle Drawing Functionality

    // Props
    let {
        width = 800,
        height = 600
    }: {
        width?: number;
        height?: number;
    } = $props();

    // State for rectangles
    let rectangles = $state<Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        stroke: string;
        fill: string;
        strokeWidth: number;
    }>>([]);

    // Drawing state
    let isDrawing = $state(false);
    let startPoint = $state({ x: 0, y: 0 });
    let currentRectangle = $state<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // Default styling
    const defaultStroke = "#3b82f6";
    const defaultFill = "rgba(59, 130, 246, 0.1)";
    const defaultStrokeWidth = 2;

    // Event handlers
    function handleMouseDown(event: MouseEvent) {
        const svg = event.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        isDrawing = true;
        startPoint = { x, y };
        currentRectangle = {
            x: x,
            y: y,
            width: 0,
            height: 0
        };
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDrawing || !currentRectangle) return;

        const svg = event.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;

        // Calculate rectangle dimensions
        const x = Math.min(startPoint.x, currentX);
        const y = Math.min(startPoint.y, currentY);
        const width = Math.abs(currentX - startPoint.x);
        const height = Math.abs(currentY - startPoint.y);

        currentRectangle = { x, y, width, height };
    }

    function handleMouseUp() {
        if (!isDrawing || !currentRectangle) return;

        // Only add rectangle if it has meaningful dimensions
        if (currentRectangle.width > 5 && currentRectangle.height > 5) {
            const newRectangle = {
                id: `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: currentRectangle.x,
                y: currentRectangle.y,
                width: currentRectangle.width,
                height: currentRectangle.height,
                stroke: defaultStroke,
                fill: defaultFill,
                strokeWidth: defaultStrokeWidth
            };

            rectangles = [...rectangles, newRectangle];
        }

        // Reset drawing state
        isDrawing = false;
        currentRectangle = null;
    }

    function clearCanvas() {
        rectangles = [];
    }

    function deleteRectangle(id: string) {
        rectangles = rectangles.filter(rect => rect.id !== id);
    }

    // Export functions for external control
    function getSvgData() {
        return {
            width,
            height,
            rectangles: rectangles.map(rect => ({ ...rect }))
        };
    }

    function setSvgData(data: { rectangles: typeof rectangles }) {
        rectangles = data.rectangles || [];
    }
</script>

<div class="svg-viewer-container">
    <div class="viewer-toolbar">
        <h3>SVG Canvas</h3>
        <div class="toolbar-actions">
            <button class="btn-secondary btn-small" onclick={clearCanvas}>
                Clear Canvas
            </button>
            <span class="rect-count">{rectangles.length} rectangle{rectangles.length !== 1 ? 's' : ''}</span>
        </div>
    </div>

    <div class="svg-canvas-container">
        <svg
            {width}
            {height}
            viewBox="0 0 {width} {height}"
            class="svg-canvas"
            onmousedown={handleMouseDown}
            onmousemove={handleMouseMove}
            onmouseup={handleMouseUp}
            onmouseleave={handleMouseUp}
            role="img"
            aria-label="SVG drawing canvas - interactive"
        >
            <!-- Grid background for better visualization -->
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Render existing rectangles -->
            {#each rectangles as rect (rect.id)}
                <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    stroke={rect.stroke}
                    fill={rect.fill}
                    stroke-width={rect.strokeWidth}
                    class="drawn-rectangle"
                    onclick={() => deleteRectangle(rect.id)}
                    onkeydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            deleteRectangle(rect.id);
                        }
                    }}
                    tabindex="0"
                    role="button"
                    aria-label="Delete rectangle"
                />
            {/each}

            <!-- Render current drawing rectangle -->
            {#if isDrawing && currentRectangle}
                <rect
                    x={currentRectangle.x}
                    y={currentRectangle.y}
                    width={currentRectangle.width}
                    height={currentRectangle.height}
                    stroke={defaultStroke}
                    fill="rgba(59, 130, 246, 0.05)"
                    stroke-width={defaultStrokeWidth}
                    stroke-dasharray="5,5"
                    class="drawing-rectangle"
                />
            {/if}
        </svg>
    </div>

    <div class="viewer-instructions">
        <p>Click and drag to draw rectangles. Click on existing rectangles to delete them.</p>
    </div>
</div>

<style>
    .svg-viewer-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 1.5rem;
        height: 100%;
    }

    .viewer-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid #334155;
    }

    .viewer-toolbar h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
    }

    .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .rect-count {
        font-size: 0.875rem;
        color: #94a3b8;
    }

    .svg-canvas-container {
        flex: 1;
        background: white;
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .svg-canvas {
        cursor: crosshair;
        background: white;
    }

    .drawn-rectangle {
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .drawn-rectangle:hover {
        opacity: 0.8;
    }

    .drawing-rectangle {
        pointer-events: none;
    }

    .viewer-instructions {
        text-align: center;
        padding-top: 1rem;
        border-top: 1px solid #334155;
    }

    .viewer-instructions p {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.25rem 0.75rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        font-size: 0.875rem;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .btn-small {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
</style>