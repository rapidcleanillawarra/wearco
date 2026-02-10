<script lang="ts">
    /**
     * EdgeDiagram.svelte
     * Generates a dynamic SVG for "edge" type diagrams.
     * Logic is driven strictly by mapped variables from the database.
     */

    let {
        fieldValues = {},
        variables = {},
        name = "Edge Diagram",
        svgString = $bindable(""),
        onFieldUpdate,
    } = $props<{
        fieldValues?: Record<string, string>;
        variables?: Record<string, string>;
        name?: string;
        svgString?: string;
        onFieldUpdate?: (fieldId: string, value: string) => void;
    }>();

    /**
     * Helper to find field values strictly using the mapping.
     */
    function getVal(internalKey: string, defaultValue: any): any {
        const sourceKey = variables[internalKey];
        if (!sourceKey) return defaultValue;

        const val = fieldValues[sourceKey];
        if (val !== undefined) {
            if (typeof defaultValue === "number") {
                const num = parseFloat(val);
                return isNaN(num) ? defaultValue : num;
            }
            return val;
        }

        return defaultValue;
    }

    // --- Static Internal Keys (Map to variables column in database) ---
    let labelPlateWidth = $derived(getVal("width", 0));
    let labelPlateLength = $derived(getVal("length", 0));
    let holeCount = $derived(getVal("hole_count", 0));
    let labelHoleDiameter = $derived(getVal("hole_diameter", 0));
    let holeType = $derived(getVal("hole_type", "circle")); // 'Circle' or 'Square'
    let labelPitch = $derived(getVal("pitch", 0));
    let labelEdgeLeft = $derived(getVal("edge_left", 0));
    let labelEdgeRight = $derived(getVal("edge_right", 0));
    let calculatedSpread = $derived(
        holeCount > 1 ? (holeCount - 1) * labelPitch : 0,
    );
    let holesSpread = $derived(getVal("holes_spread", calculatedSpread));

    // --- Visual Layout Parameters (USED FOR SVG GEOMETRY) ---
    // We use a fixed visual scale so the diagram remains readable regardless of the label values.
    const VISUAL_HOLE_SPACING = 100; // Pixels between holes visually
    const VISUAL_EDGE_PADDING = 120; // Padding from plate edge to first/last hole
    const VISUAL_PLATE_HEIGHT = 400; // Fixed visual height of the plate
    const VISUAL_HOLE_SIZE = 30; // Fixed visual diameter/side of holes
    const CANVAS_PADDING = 80; // Padding around the plate for dimensions

    // Calculate visual plate width based on hole count
    let visualPlateWidth = $derived.by(() => {
        if (holeCount <= 1)
            return VISUAL_EDGE_PADDING * 2 + VISUAL_HOLE_SPACING;
        return VISUAL_EDGE_PADDING * 2 + (holeCount - 1) * VISUAL_HOLE_SPACING;
    });

    // Position Calculations (Visual Coordinates)
    const rectX = CANVAS_PADDING;
    const rectY = CANVAS_PADDING * 2;
    const centerY = rectY + VISUAL_PLATE_HEIGHT / 2;

    // ViewBox Calculations
    let vbWidth = $derived(visualPlateWidth + CANVAS_PADDING * 2);
    let vbHeight = $derived(VISUAL_PLATE_HEIGHT + CANVAS_PADDING * 4);

    // Hole Positions (Visual Coordinates)
    const holePositions = $derived.by(() => {
        if (holeCount <= 0) return [];
        if (holeCount === 1) return [rectX + visualPlateWidth / 2];

        return Array.from(
            { length: holeCount },
            (_, i) => rectX + VISUAL_EDGE_PADDING + i * VISUAL_HOLE_SPACING,
        );
    });

    // Expose the SVG string for downloading or other uses
    let svgElement = $state<SVGSVGElement | null>(null);

    $effect(() => {
        // Dependencies to trigger serialization on any change
        const _deps = [
            labelPlateWidth,
            labelPlateLength,
            holeCount,
            labelHoleDiameter,
            holeType,
            labelPitch,
            labelEdgeLeft,
            labelEdgeRight,
            holesSpread,
        ];

        if (svgElement) {
            const serializer = new XMLSerializer();
            svgString = serializer.serializeToString(svgElement);
        }
    });

    /**
     * TWO-WAY SYNC LOGIC
     * Automate calculations and push them back to the overlay fields.
     */
    $effect(() => {
        if (!onFieldUpdate) return;

        // Calculate Hole Spread (Distance from center of first hole to center of last hole)
        // We use the calculatedSpread derived above

        // 1. Sync Holes Spread (if mapped)
        const spreadKey =
            variables["holes_spread"] || variables["total_holes_distance"];
        if (spreadKey) {
            const currentSpreadVal = parseFloat(fieldValues[spreadKey] || "0");
            if (Math.abs(currentSpreadVal - calculatedSpread) > 0.1) {
                onFieldUpdate(
                    spreadKey,
                    Math.round(calculatedSpread).toString(),
                );
            }
        }

        // 2. Sync Total Width (if mapped)
        // Usually Width = Left Edge + Spread + Right Edge
        const calculatedWidth =
            calculatedSpread + labelEdgeLeft + labelEdgeRight;
        const widthKey = variables["width"];
        if (widthKey) {
            const currentWidthVal = parseFloat(fieldValues[widthKey] || "0");
            if (
                calculatedWidth > 0 &&
                Math.abs(currentWidthVal - calculatedWidth) > 0.1
            ) {
                onFieldUpdate(widthKey, Math.round(calculatedWidth).toString());
            }
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
        <!-- Definitions for arrows or styles -->
        <defs>
            <style>
                .dim-label text {
                    font-family:
                        "Inter",
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Roboto,
                        sans-serif;
                    font-weight: 500;
                }
                line {
                    stroke-linecap: round;
                }
            </style>
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
            width={visualPlateWidth}
            height={VISUAL_PLATE_HEIGHT}
            fill="none"
            stroke="#1e1b4b"
            stroke-width="2"
        />

        <!-- Overall Width Dimension -->
        <g class="dim-label">
            <line
                x1={rectX + 2}
                y1={rectY - 20}
                x2={rectX + visualPlateWidth - 2}
                y2={rectY - 20}
                stroke="#1e1b4b"
                stroke-width="1"
                marker-start="url(#arrow-start)"
                marker-end="url(#arrow-end)"
            />
            <text
                x={rectX + visualPlateWidth / 2}
                y={rectY - 30}
                text-anchor="middle"
                font-size="20"
                fill="#1e1b4b">{Math.round(labelPlateWidth)} mm</text
            >
        </g>

        <!-- Overall Height Dimension -->
        <g class="dim-label">
            <line
                x1={rectX - 20}
                y1={rectY + 2}
                x2={rectX - 20}
                y2={rectY + VISUAL_PLATE_HEIGHT - 2}
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
                >{Math.round(labelPlateLength)} mm</text
            >
        </g>

        <!-- Holes -->
        {#each holePositions as hx}
            {#if holeType.toLowerCase().includes("square")}
                <rect
                    x={hx - VISUAL_HOLE_SIZE / 2}
                    y={centerY - VISUAL_HOLE_SIZE / 2}
                    width={VISUAL_HOLE_SIZE}
                    height={VISUAL_HOLE_SIZE}
                    fill="none"
                    stroke="#1e1b4b"
                    stroke-width="2"
                />
            {:else}
                <circle
                    cx={hx}
                    cy={centerY}
                    r={VISUAL_HOLE_SIZE / 2}
                    fill="none"
                    stroke="#1e1b4b"
                    stroke-width="2"
                />
            {/if}
        {/each}

        <!-- Hole Diameter Dimension (Above first or second hole) -->
        {#if holePositions.length > 0}
            {@const holeIndex = holePositions.length > 1 ? 1 : 0}
            {@const anchorHx = holePositions[holeIndex]}
            {@const dimY_hole = centerY - VISUAL_HOLE_SIZE / 2 - 40}
            <g class="dim-label">
                <line
                    x1={anchorHx - VISUAL_HOLE_SIZE / 2 + 2}
                    y1={dimY_hole}
                    x2={anchorHx + VISUAL_HOLE_SIZE / 2 - 2}
                    y2={dimY_hole}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={anchorHx - VISUAL_HOLE_SIZE / 2}
                    y1={centerY - VISUAL_HOLE_SIZE / 2 - 5}
                    x2={anchorHx - VISUAL_HOLE_SIZE / 2}
                    y2={dimY_hole - 5}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={anchorHx + VISUAL_HOLE_SIZE / 2}
                    y1={centerY - VISUAL_HOLE_SIZE / 2 - 5}
                    x2={anchorHx + VISUAL_HOLE_SIZE / 2}
                    y2={dimY_hole - 5}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={anchorHx}
                    y={dimY_hole - 10}
                    text-anchor="middle"
                    font-size="18"
                    fill="#1e1b4b">Ø{Math.round(labelHoleDiameter)} mm</text
                >
            </g>
        {/if}

        <!-- Edge Distance Left -->
        {#if holePositions.length > 0}
            {@const dimY_left = centerY + VISUAL_PLATE_HEIGHT / 6}
            <g class="dim-label">
                <line
                    x1={rectX + 2}
                    y1={dimY_left}
                    x2={holePositions[0] - 2}
                    y2={dimY_left}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <text
                    x={rectX + (holePositions[0] - rectX) / 2}
                    y={dimY_left + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(labelEdgeLeft)} mm</text
                >
            </g>
        {/if}

        <!-- Pitch (Between first two holes) -->
        {#if holePositions.length > 1}
            {@const dimY_pitch = centerY + VISUAL_PLATE_HEIGHT / 6}
            <g class="dim-label">
                <line
                    x1={holePositions[0] + 2}
                    y1={dimY_pitch}
                    x2={holePositions[1] - 2}
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
                    x={holePositions[0] + VISUAL_HOLE_SPACING / 2}
                    y={dimY_pitch + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(labelPitch)} mm</text
                >
            </g>
        {/if}

        <!-- Pitch (Between first and third holes) -->
        {#if holePositions.length > 2}
            {@const dimY_pitch13 = centerY + VISUAL_PLATE_HEIGHT / 4}
            <g class="dim-label">
                <line
                    x1={holePositions[0] + 2}
                    y1={dimY_pitch13}
                    x2={holePositions[2] - 2}
                    y2={dimY_pitch13}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY + 5}
                    x2={holePositions[0]}
                    y2={dimY_pitch13 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[2]}
                    y1={centerY + 5}
                    x2={holePositions[2]}
                    y2={dimY_pitch13 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] + VISUAL_HOLE_SPACING}
                    y={dimY_pitch13 + 20}
                    text-anchor="middle"
                    font-size="14"
                    fill="#1e1b4b">{Math.round(labelPitch * 2)} mm</text
                >
            </g>
        {/if}

        <!-- Pitch (Between first and fourth holes) -->
        {#if holePositions.length > 3}
            {@const dimY_pitch14 = centerY + (VISUAL_PLATE_HEIGHT * 5) / 16}
            <g class="dim-label">
                <line
                    x1={holePositions[0] + 2}
                    y1={dimY_pitch14}
                    x2={holePositions[3] - 2}
                    y2={dimY_pitch14}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY + 5}
                    x2={holePositions[0]}
                    y2={dimY_pitch14 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[3]}
                    y1={centerY + 5}
                    x2={holePositions[3]}
                    y2={dimY_pitch14 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] + (VISUAL_HOLE_SPACING * 3) / 2}
                    y={dimY_pitch14 + 20}
                    text-anchor="middle"
                    font-size="14"
                    fill="#1e1b4b">{Math.round(labelPitch * 3)} mm</text
                >
            </g>
        {/if}

        <!-- Pitch (Between first and fifth holes) -->
        {#if holePositions.length > 4}
            {@const dimY_pitch15 = centerY + (VISUAL_PLATE_HEIGHT * 6) / 16}
            <g class="dim-label">
                <line
                    x1={holePositions[0] + 2}
                    y1={dimY_pitch15}
                    x2={holePositions[4] - 2}
                    y2={dimY_pitch15}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY + 5}
                    x2={holePositions[0]}
                    y2={dimY_pitch15 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[4]}
                    y1={centerY + 5}
                    x2={holePositions[4]}
                    y2={dimY_pitch15 + 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] + (VISUAL_HOLE_SPACING * 4) / 2}
                    y={dimY_pitch15 + 20}
                    text-anchor="middle"
                    font-size="14"
                    fill="#1e1b4b">{Math.round(labelPitch * 4)} mm</text
                >
            </g>
        {/if}

        <!-- Edge Distance Right -->
        {#if holePositions.length > 0}
            {@const dimY_right = centerY + VISUAL_PLATE_HEIGHT / 6}
            <g class="dim-label">
                <line
                    x1={holePositions[holePositions.length - 1] + 2}
                    y1={dimY_right}
                    x2={rectX + visualPlateWidth - 2}
                    y2={dimY_right}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <text
                    x={rectX +
                        visualPlateWidth -
                        (rectX +
                            visualPlateWidth -
                            holePositions[holePositions.length - 1]) /
                            2}
                    y={dimY_right + 20}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(labelEdgeRight)} mm</text
                >
            </g>
        {/if}

        <!-- Total Hole Distance (Inside, above holes) -->
        {#if holePositions.length > 1}
            {@const dimY_total = centerY - VISUAL_PLATE_HEIGHT / 4}
            <g class="dim-label">
                <line
                    x1={holePositions[0] + 2}
                    y1={dimY_total}
                    x2={holePositions[holePositions.length - 1] - 2}
                    y2={dimY_total}
                    stroke="#1e1b4b"
                    stroke-width="1"
                    marker-start="url(#arrow-start)"
                    marker-end="url(#arrow-end)"
                />
                <line
                    x1={holePositions[0]}
                    y1={centerY - 5}
                    x2={holePositions[0]}
                    y2={dimY_total - 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <line
                    x1={holePositions[holePositions.length - 1]}
                    y1={centerY - 5}
                    x2={holePositions[holePositions.length - 1]}
                    y2={dimY_total - 10}
                    stroke="#9ca3af"
                    stroke-width="1"
                    stroke-dasharray="4 2"
                />
                <text
                    x={holePositions[0] +
                        (holePositions[holePositions.length - 1] -
                            holePositions[0]) /
                            2}
                    y={dimY_total - 10}
                    text-anchor="middle"
                    font-size="16"
                    fill="#1e1b4b">{Math.round(holesSpread)} mm</text
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
