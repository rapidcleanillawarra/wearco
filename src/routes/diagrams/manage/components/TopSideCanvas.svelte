<script lang="ts">
    // Static Diagram Canvas Component
    // Displays a vertically-oriented rectangle with three evenly-spaced circles

    // Props
    let {
        width = 800,
        height = 400
    }: {
        width?: number;
        height?: number;
    } = $props();

    // Diagram dimensions and styling
    const rectangleWidth = 200;
    const rectangleHeight = 300;
    const circleRadius = 20;

    // Reactive calculations for positions
    let rectangleX = $state(0);
    let rectangleY = $state(0);
    let circleY = $state(0);
    let circlePositions = $state<number[]>([]);

    $effect(() => {
        // Calculate positions
        rectangleX = (width - rectangleWidth) / 2;
        rectangleY = (height - rectangleHeight) / 2;

        // Three circles evenly spaced horizontally within the rectangle
        const horizontalSpacing = rectangleWidth / 4; // Divide into 4 equal parts
        circleY = rectangleY + rectangleHeight / 2; // Center vertically

        // Circle X positions: left, center, right
        circlePositions = [
            rectangleX + horizontalSpacing,         // First circle
            rectangleX + horizontalSpacing * 2,     // Second circle (center)
            rectangleX + horizontalSpacing * 3      // Third circle
        ];
    });
</script>

<div class="diagram-canvas-container">
    <div class="canvas-header">
        <h3>Diagram Preview</h3>
    </div>

    <div class="svg-canvas-container">
        <svg
            {width}
            {height}
            viewBox="0 0 {width} {height}"
            class="svg-canvas"
            role="img"
            aria-label="Static diagram display showing a rectangle with three circles"
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
                width={rectangleWidth}
                height={rectangleHeight}
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
                    r={circleRadius}
                    fill="#10b981"
                    stroke="#059669"
                    stroke-width="2"
                />
            {/each}
        </svg>
    </div>

    <div class="canvas-info">
        <p>Static diagram representation: Rectangle with three horizontally aligned circles</p>
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
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
    }

    .svg-canvas-container {
        flex: 1;
        background: #ffffff;
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .svg-canvas {
        background: #ffffff;
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
</style>