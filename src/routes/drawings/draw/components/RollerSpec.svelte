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
    const vbWidth = 297;
    const vbHeight = 210;
</script>

<div class="dynamic-svg-container">
    <svg
        bind:this={svgElement}
        viewBox="0 0 {vbWidth} {vbHeight}"
        xmlns="http://www.w3.org/2000/svg"
        class="dynamic-svg"
    >
        <!-- Placeholder Rectangle for Roller Spec -->
        <rect
            x="50"
            y="55"
            width="197"
            height="100"
            fill="none"
            stroke="#1e1b4b"
            stroke-width="1"
        />
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
</style>
