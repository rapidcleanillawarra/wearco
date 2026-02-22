<script lang="ts">
    let {
        fieldValues = {},
        variables = {},
        name = "Edge Diagram",
        svgString = $bindable(""),
        pitchConfigs = [
            { from: 1, to: 2, prefix: "", suffix: "" },
        ],
    } = $props<{
        fieldValues?: Record<string, string>;
        variables?: Record<string, string>;
        name?: string;
        svgString?: string;
        pitchConfigs?: {
            from: number;
            to: number;
            prefix?: string;
            suffix?: string;
            label?: string;
        }[];
    }>();

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

    let labelPlateWidth = $derived(getVal("width", 0));
    let labelPlateLength = $derived(getVal("length", 0));
    let holeCount = $derived(getVal("hole_count", 0));
    let labelHoleDiameter = $derived(getVal("hole_diameter", 0));
    let holeType = $derived(getVal("hole_type", "circle"));
    let labelPitch = $derived(getVal("pitch", 0));
    let labelEdgeLeft = $derived(getVal("edge_left", 0));
    let labelEdgeRight = $derived(getVal("edge_right", 0));
    let calculatedSpread = $derived(
        holeCount > 1 ? (holeCount - 1) * labelPitch : 0,
    );
    let holesSpread = $derived(getVal("holes_spread", calculatedSpread));

    const VISUAL_HOLE_SPACING = 100;
    const VISUAL_EDGE_PADDING = 120;
    const VISUAL_PLATE_BASE_HEIGHT = 300;
    const VISUAL_HOLE_SIZE = 40;
    const CANVAS_PADDING = 100;

    let effectiveHoleCount = $derived(holeCount);

    let validPitchConfigs = $derived(
        pitchConfigs.filter(
            (p: any) => p.from >= 1 && p.to > p.from && p.to <= holeCount,
        ),
    );

    let visualPlateWidth = $derived.by(() => {
        if (effectiveHoleCount <= 1)
            return VISUAL_EDGE_PADDING * 2 + VISUAL_HOLE_SPACING;
        return (
            VISUAL_EDGE_PADDING * 2 +
            (effectiveHoleCount - 1) * VISUAL_HOLE_SPACING
        );
    });

    let visualPlateHeight = $derived(VISUAL_PLATE_BASE_HEIGHT);

    const rectX = CANVAS_PADDING;
    const rectY = CANVAS_PADDING * 2;
    const centerY = $derived(rectY + visualPlateHeight / 2);

    let vbWidth = $derived(visualPlateWidth + CANVAS_PADDING * 2);
    let vbHeight = $derived(visualPlateHeight + CANVAS_PADDING * 4);

    const holePositions = $derived.by(() => {
        if (effectiveHoleCount <= 0) return [];
        if (effectiveHoleCount === 1) return [rectX + visualPlateWidth / 2];
        return Array.from(
            { length: effectiveHoleCount },
            (_, i) => rectX + VISUAL_EDGE_PADDING + i * VISUAL_HOLE_SPACING,
        );
    });

    let svgElement = $state<SVGSVGElement | null>(null);

    $effect(() => {
        const _deps = [
            labelPlateWidth, labelPlateLength, holeCount, labelHoleDiameter,
            holeType, labelPitch, labelEdgeLeft, labelEdgeRight, holesSpread,
            pitchConfigs, validPitchConfigs,
        ];
        if (svgElement) {
            svgString = new XMLSerializer().serializeToString(svgElement);
        }
    });
</script>

<div class="view-svg-container">
    <svg
        bind:this={svgElement}
        viewBox="0 0 {vbWidth} {vbHeight}"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <style>
                .dim-label text {
                    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-weight: 500;
                }
                line { stroke-linecap: round; }
            </style>
            <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#1e1b4b" />
            </marker>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e1b4b" />
            </marker>
        </defs>

        <rect x={rectX} y={rectY} width={visualPlateWidth} height={visualPlateHeight} fill="none" stroke="#1e1b4b" stroke-width="2" />

        <!-- Overall Width -->
        <g class="dim-label">
            <line x1={rectX + 2} y1={rectY - 20} x2={rectX + visualPlateWidth - 2} y2={rectY - 20} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
            <text x={rectX + visualPlateWidth / 2} y={rectY - 30} text-anchor="middle" font-size="20" fill="#1e1b4b">{Math.round(labelPlateWidth)} mm</text>
        </g>

        <!-- Overall Height -->
        <g class="dim-label">
            <line x1={rectX - 20} y1={rectY + 2} x2={rectX - 20} y2={rectY + visualPlateHeight - 2} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
            <text x={rectX - 30} y={centerY} text-anchor="middle" font-size="20" fill="#1e1b4b" transform="rotate(-90, {rectX - 30}, {centerY})">{Math.round(labelPlateLength)} mm</text>
        </g>

        <!-- Holes -->
        {#each holePositions as hx, i}
            {#if holeType.toLowerCase().includes("square")}
                <rect x={hx - VISUAL_HOLE_SIZE / 2} y={centerY - VISUAL_HOLE_SIZE / 2} width={VISUAL_HOLE_SIZE} height={VISUAL_HOLE_SIZE} fill="none" stroke="#1e1b4b" stroke-width="2" />
            {:else}
                <circle cx={hx} cy={centerY} r={VISUAL_HOLE_SIZE / 2} fill="none" stroke="#1e1b4b" stroke-width="2" />
            {/if}
            <text x={hx} y={centerY} text-anchor="middle" dominant-baseline="central" font-size="16" fill="#1e1b4b" font-weight="bold">{i + 1}</text>
        {/each}

        <!-- Hole Diameter -->
        {#if holePositions.length > 0}
            {@const holeIndex = holePositions.length > 1 ? 1 : 0}
            {@const anchorHx = holePositions[holeIndex]}
            {@const dimY_hole = centerY - VISUAL_HOLE_SIZE / 2 - 20}
            <g class="dim-label">
                <line x1={anchorHx - VISUAL_HOLE_SIZE / 2 + 2} y1={dimY_hole} x2={anchorHx + VISUAL_HOLE_SIZE / 2 - 2} y2={dimY_hole} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
                <line x1={anchorHx - VISUAL_HOLE_SIZE / 2} y1={centerY - VISUAL_HOLE_SIZE / 2 - 5} x2={anchorHx - VISUAL_HOLE_SIZE / 2} y2={dimY_hole - 5} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <line x1={anchorHx + VISUAL_HOLE_SIZE / 2} y1={centerY - VISUAL_HOLE_SIZE / 2 - 5} x2={anchorHx + VISUAL_HOLE_SIZE / 2} y2={dimY_hole - 5} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <text x={anchorHx} y={dimY_hole - 10} text-anchor="middle" font-size="18" fill="#1e1b4b">Ø{Math.round(labelHoleDiameter)} mm</text>
            </g>
        {/if}

        <!-- Edge Distance Left -->
        {#if holePositions.length > 0}
            {@const dimY_top = centerY - visualPlateHeight / 4}
            <g class="dim-label">
                <line x1={rectX + 2} y1={dimY_top} x2={holePositions[0] - 2} y2={dimY_top} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
                <line x1={rectX} y1={centerY - 5} x2={rectX} y2={dimY_top - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <line x1={holePositions[0]} y1={centerY - 5} x2={holePositions[0]} y2={dimY_top - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <text x={rectX + (holePositions[0] - rectX) / 2} y={dimY_top - 10} text-anchor="middle" font-size="16" fill="#1e1b4b">{Math.round(labelEdgeLeft)} mm</text>
            </g>
        {/if}

        <!-- Dynamic Pitch Dimensions -->
        {#each validPitchConfigs as config, i}
            {@const fromIdx = config.from - 1}
            {@const toIdx = config.to - 1}
            {@const dimY = centerY + visualPlateHeight / 6 + i * (visualPlateHeight / 8)}
            {@const dist = config.to - config.from}
            <g class="dim-label">
                <line x1={holePositions[fromIdx] + 2} y1={dimY} x2={holePositions[toIdx] - 2} y2={dimY} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
                <line x1={holePositions[fromIdx]} y1={centerY + 5} x2={holePositions[fromIdx]} y2={dimY + 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <line x1={holePositions[toIdx]} y1={centerY + 5} x2={holePositions[toIdx]} y2={dimY + 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <text x={holePositions[fromIdx] + (holePositions[toIdx] - holePositions[fromIdx]) / 2} y={dimY + 20} text-anchor="middle" font-size={dist > 1 ? "14" : "16"} fill="#1e1b4b">{config.prefix ?? config.label ?? ""}{Math.round(labelPitch * dist)} mm{config.suffix ?? ""}</text>
            </g>
        {/each}

        <!-- Edge Distance Right -->
        {#if holePositions.length > 0}
            {@const dimY_top = centerY - visualPlateHeight / 4}
            <g class="dim-label">
                <line x1={holePositions[holePositions.length - 1] + 2} y1={dimY_top} x2={rectX + visualPlateWidth - 2} y2={dimY_top} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
                <line x1={holePositions[holePositions.length - 1]} y1={centerY - 5} x2={holePositions[holePositions.length - 1]} y2={dimY_top - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <line x1={rectX + visualPlateWidth} y1={centerY - 5} x2={rectX + visualPlateWidth} y2={dimY_top - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <text x={rectX + visualPlateWidth - (rectX + visualPlateWidth - holePositions[holePositions.length - 1]) / 2} y={dimY_top - 10} text-anchor="middle" font-size="16" fill="#1e1b4b">{Math.round(labelEdgeRight)} mm</text>
            </g>
        {/if}

        <!-- Total Hole Distance -->
        {#if holePositions.length > 1}
            {@const dimY_total = centerY - visualPlateHeight / 4}
            <g class="dim-label">
                <line x1={holePositions[0] + 2} y1={dimY_total} x2={holePositions[holePositions.length - 1] - 2} y2={dimY_total} stroke="#1e1b4b" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
                <line x1={holePositions[0]} y1={centerY - 5} x2={holePositions[0]} y2={dimY_total - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <line x1={holePositions[holePositions.length - 1]} y1={centerY - 5} x2={holePositions[holePositions.length - 1]} y2={dimY_total - 10} stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 2" />
                <text x={holePositions[0] + (holePositions[holePositions.length - 1] - holePositions[0]) / 2} y={dimY_total - 10} text-anchor="middle" font-size="16" fill="#1e1b4b">{Math.round(holesSpread)} mm</text>
            </g>
        {/if}
    </svg>
</div>

<style>
    .view-svg-container {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
    }

    .view-svg-container svg {
        width: 100%;
        height: auto;
    }
</style>
