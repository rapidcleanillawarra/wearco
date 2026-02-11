<script lang="ts">
    /**
     * RollerSpec.svelte
     * Generates a dynamic SVG for "roller_spec" type diagrams.
     * Maps overlay inputs to constant diagram variables.
     */

    let {
        fieldValues = {},
        variables = {},
        name = "Roller Spec",
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

    // --- Mapped Variables (Variables column in wearco_diagrams table) ---
    let faceWidth = $derived(getVal("face_width", 0));
    let slotWidth = $derived(getVal("slot_width", 0));
    let backToBack = $derived(getVal("back_to_back", 0));
    let typeOfSlot = $derived(getVal("type_of_slot", ""));
    let shaftOverall = $derived(getVal("shaft_overall", 0));
    let shaftDiameter = $derived(getVal("shaft_diameter", 0));
    let rollerDiameter = $derived(getVal("roller_diameter", 0));

    // Expose the SVG string for downloading or other uses
    let svgElement = $state<SVGSVGElement | null>(null);

    $effect(() => {
        // Dependencies to trigger serialization on any change
        const _deps = [
            faceWidth,
            slotWidth,
            backToBack,
            typeOfSlot,
            shaftOverall,
            shaftDiameter,
            rollerDiameter,
        ];

        if (svgElement) {
            const serializer = new XMLSerializer();
            svgString = serializer.serializeToString(svgElement);
        }
    });

    // Visual dimensions for the placeholder rectangle
    const vbWidth = 1000;
    const vbHeight = 1000;
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
            </style>
        </defs>

        <!-- Background/Border for the SVG -->
        <rect
            x="10"
            y="10"
            width={vbWidth - 20}
            height={vbHeight - 20}
            fill="#f8fafc"
            stroke="#e2e8f0"
            stroke-width="1"
        />

        <!-- Placeholder Rectangle for Roller Spec -->
        <rect
            x="200"
            y="150"
            width="400"
            height="300"
            fill="none"
            stroke="#1e1b4b"
            stroke-width="2"
        />

        <!-- Legend/Labels for Verification -->
        <g
            transform="translate(20, 40)"
            class="dim-label"
            font-size="14"
            fill="#1e1b4b"
        >
            <text font-weight="bold" font-size="16" y="0">{name}</text>

            <g transform="translate(0, 30)">
                <text y="0">Face Width: {faceWidth} mm</text>
                <text y="20">Slot Width: {slotWidth} mm</text>
                <text y="40">Back to Back: {backToBack} mm</text>
                <text y="60">Type of Slot: {typeOfSlot}</text>
                <text y="80">Shaft Overall: {shaftOverall} mm</text>
                <text y="100">Shaft Diameter: {shaftDiameter} mm</text>
                <text y="120">Roller Diameter: {rollerDiameter} mm</text>
            </g>
        </g>

        <!-- Center Message -->
        <text
            x={vbWidth / 2}
            y={vbHeight / 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="Inter, sans-serif"
            font-size="24"
            fill="#64748b"
        >
            Roller Spec Placeholder
        </text>
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
