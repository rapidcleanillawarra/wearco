<script lang="ts">
    /**
     * EdgeDiagram.svelte
     * Generates a dynamic SVG for "edge" type diagrams.
     * Logic is driven by fieldValues from the PDF overlay.
     */

    let {
        fieldValues = {},
        name = "Edge Diagram",
        svgString = $bindable(""),
    } = $props<{
        fieldValues?: Record<string, string>;
        name?: string;
        svgString?: string;
    }>();

    // Helper to find field values by searching labels or common patterns
    function getVal(keywords: string[], defaultValue: any): any {
        // In a real scenario, we might have a mapping of field IDs to types.
        // For now, we'll scan the values for common naming patterns or just use a default.
        // We can also assume specific field IDs if they are standard across templates.

        // Let's look for keys that contain any of the keywords (case insensitive)
        const entry = (Object.entries(fieldValues) as [string, string][]).find(
            ([id, val]) => {
                const lowerId = id.toLowerCase();
                return keywords.some((k: string) =>
                    lowerId.includes(k.toLowerCase()),
                );
            },
        );

        if (entry) {
            const [_, val] = entry;
            if (typeof defaultValue === "number") {
                const num = parseFloat(val);
                return isNaN(num) ? defaultValue : num;
            }
            return val;
        }
        return defaultValue;
    }

    // Dynamic Diagram Parameters derived from fieldValues
    // We try to match common names used in the templates
    let plateWidth = $derived(getVal(["width", "centerEdge-width"], 2000));
    let plateHeight = $derived(getVal(["height", "plate_h"], 400));
    let holeCount = $derived(getVal(["hole_count", "holes", "qty"], 20));
    let holeDiameter = $derived(getVal(["dia", "hole_size"], 40));
    let holeType = $derived(getVal(["hole_type", "shape"], "Circle")); // 'Circle' or 'Square'

    // Layout Constants (mm)
    const CANVAS_PADDING = 80;

    // ViewBox Calculations
    const vbWidth = $derived(plateWidth + CANVAS_PADDING * 2);
    const vbHeight = $derived(plateHeight + CANVAS_PADDING * 4); // Extra space for labels

    // Position Calculations
    const rectX = CANVAS_PADDING;
    const rectY = CANVAS_PADDING * 2;
    const centerY = $derived(rectY + plateHeight / 2);

    // Hole Positions (Simplified: evenly spaced)
    const holePositions = $derived.by(() => {
        if (holeCount <= 0) return [];
        if (holeCount === 1) return [rectX + plateWidth / 2];

        // Calculate pitch based on 4 segments for 3 holes, or N+1 segments for N holes
        const pitchMm = plateWidth / (holeCount + 1);
        return Array.from(
            { length: holeCount },
            (_, i) => rectX + (i + 1) * pitchMm,
        );
    });

    const pitch = $derived(
        holePositions.length > 1 ? holePositions[1] - holePositions[0] : 0,
    );
    const edgeDistLeft = $derived(
        holePositions.length > 0 ? holePositions[0] - rectX : 0,
    );
    const edgeDistRight = $derived(
        holePositions.length > 0
            ? rectX + plateWidth - holePositions[holePositions.length - 1]
            : 0,
    );
    const totalHoleDistance = $derived(
        holePositions.length > 1
            ? holePositions[holePositions.length - 1] - holePositions[0]
            : 0,
    );

    // Expose the SVG string for downloading or other uses
    let svgElement = $state<SVGSVGElement | null>(null);

    $effect(() => {
        if (svgElement) {
            const serializer = new XMLSerializer();
            svgString = serializer.serializeToString(svgElement);
        }
    });
</script>

<div class="dynamic-svg-container">
    <svg
        bind:this={svgElement}
        viewBox="0 0 {vbWidth} {vbHeight}"
        xmlns="http://www.w3.org/2000/svg"
        class="dynamic-svg"
    >
        <!-- Definitions for arrows -->
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
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#1e1b4b" />
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
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e1b4b" />
            </marker>
        </defs>

        <!-- Plate -->
        <rect
            x={rectX}
            y={rectY}
            width={plateWidth}
            height={plateHeight}
            fill="none"
            stroke="#1e1b4b"
            stroke-width="2"
        />

        <!-- Overall Width Dimension -->
        <g class="dim-label">
            <line
                x1={rectX}
                y1={rectY - 20}
                x2={rectX + plateWidth}
                y2={rectY - 20}
                stroke="#1e1b4b"
                stroke-width="1"
                marker-start="url(#arrow-start)"
                marker-end="url(#arrow-end)"
            />
            <text
                x={rectX + plateWidth / 2}
                y={rectY - 30}
                text-anchor="middle"
                font-size="20"
                fill="#1e1b4b">{Math.round(plateWidth)} mm</text
            >
        </g>

        <!-- Overall Height Dimension -->
        <g class="dim-label">
            <line
                x1={rectX - 20}
                y1={rectY}
                x2={rectX - 20}
                y2={rectY + plateHeight}
                stroke="#1e1b4b"
                stroke-width="1"
                marker-start="url(#arrow-start)"
                marker-end="url(#arrow-end)"
            />
            <text
                x={rectX - 30}
                y={centerY}
                text-anchor="middle"
                font-size="20"
                fill="#1e1b4b"
                transform="rotate(-90, {rectX - 30}, {centerY})"
                >{Math.round(plateHeight)} mm</text
            >
        </g>

        <!-- Holes -->
        {#each holePositions as hx}
            {#if holeType.toLowerCase().includes("square")}
                <rect
                    x={hx - holeDiameter / 2}
                    y={centerY - holeDiameter / 2}
                    width={holeDiameter}
                    height={holeDiameter}
                    fill="none"
                    stroke="#1e1b4b"
                    stroke-width="2"
                />
            {:else}
                <circle
                    cx={hx}
                    cy={centerY}
                    r={holeDiameter / 2}
                    fill="none"
                    stroke="#1e1b4b"
                    stroke-width="2"
                />
            {/if}
        {/each}

        <!-- Hole Diameter Dimension (Above first hole) -->
        {#if holePositions.length > 0}
            {@const firstHx = holePositions[0]}
            {@const dimY_hole = centerY - holeDiameter / 2 - 40}
            <g class="dim-label">
                <line
                    x1={firstHx - holeDiameter / 2}
                    y1={dimY_hole}
                    x2={firstHx + holeDiameter / 2}
                    y2={dimY_hole}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={firstHx - holeDiameter / 2}
                    y1={centerY - holeDiameter / 2 - 5}
                    x2={firstHx - holeDiameter / 2}
                    y2={dimY_hole - 5}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={firstHx + holeDiameter / 2}
                    y1={centerY - holeDiameter / 2 - 5}
                    x2={firstHx + holeDiameter / 2}
                    y2={dimY_hole - 5}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={firstHx}
                    y={dimY_hole - 10}
                    text-anchor="middle"
                    font-size="18"
                    fill="#1e1b4b">Ø{Math.round(holeDiameter)} mm</text
                >
            </g>
        {/if}

        <!-- Edge Distance Left -->
        {#if holePositions.length > 0}
            {@const dimY_left = centerY + plateHeight / 6}
            <g class="dim-label">
                <line
                    x1={rectX}
                    y1={dimY_left}
                    x2={holePositions[0]}
                    y2={dimY_left}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <text
                    x={rectX + edgeDistLeft / 2}
                    y={dimY_left + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(edgeDistLeft)} mm</text
                >
            </g>
        {/if}

        <!-- Pitch (Between first two holes) -->
        {#if holePositions.length > 1}
            {@const dimY_pitch = centerY + plateHeight / 6}
            <g class="dim-label">
                <line
                    x1={holePositions[0]}
                    y1={dimY_pitch}
                    x2={holePositions[1]}
                    y2={dimY_pitch}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY + 5}
                    x2={holePositions[0]}
                    y2={dimY_pitch + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[1]}
                    y1={centerY + 5}
                    x2={holePositions[1]}
                    y2={dimY_pitch + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] + pitch / 2}
                    y={dimY_pitch + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(pitch)} mm</text
                >
            </g>
        {/if}

        <!-- Edge Distance Right -->
        {#if holePositions.length > 0}
            {@const dimY_right = centerY + plateHeight / 6}
            <g class="dim-label">
                <line
                    x1={holePositions[holePositions.length - 1]}
                    y1={dimY_right}
                    x2={rectX + plateWidth}
                    y2={dimY_right}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <text
                    x={rectX + plateWidth - edgeDistRight / 2}
                    y={dimY_right + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(edgeDistRight)} mm</text
                >
            </g>
        {/if}

        <!-- Total Hole Distance -->
        {#if holePositions.length > 1}
            {@const dimY_total = centerY + plateHeight / 3}
            <g class="dim-label">
                <line
                    x1={holePositions[0]}
                    y1={dimY_total}
                    x2={holePositions[holePositions.length - 1]}
                    y2={dimY_total}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY + 5}
                    x2={holePositions[0]}
                    y2={dimY_total + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[holePositions.length - 1]}
                    y1={centerY + 5}
                    x2={holePositions[holePositions.length - 1]}
                    y2={dimY_total + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] + totalHoleDistance / 2}
                    y={dimY_total + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(totalHoleDistance)} mm</text
                >
            </g>
        {/if}
    </svg>
</div>

<style>
    .dynamic-svg-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        padding: 20px;
    }

    .dynamic-svg {
        width: 100%;
        height: auto;
        max-height: 100%;
    }

    .dim-label text {
        font-family: "Inter", sans-serif;
        font-weight: 500;
    }
</style>
