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
    let typeOfSlot = $derived(String(getVal("type_of_slot", "4")));
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

        <!-- Parallel lines on left and right -->
        <line
            x1="45"
            y1="60"
            x2="45"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />
        <line
            x1="252"
            y1="60"
            x2="252"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />

        <!-- Connecting lines from corners -->
        <!-- Left top -->
        <line
            x1="50"
            y1="55"
            x2="45"
            y2="60"
            stroke="#1e1b4b"
            stroke-width="1"
        />
        <!-- Left bottom -->
        <line
            x1="50"
            y1="155"
            x2="45"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />
        <!-- Right top -->
        <line
            x1="247"
            y1="55"
            x2="252"
            y2="60"
            stroke="#1e1b4b"
            stroke-width="1"
        />
        <!-- Right bottom -->
        <line
            x1="247"
            y1="155"
            x2="252"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />

        <!-- Type-dependent slots -->
        <!-- Left side -->
        {#if typeOfSlot === "2"}
            <path
                d="m 1.3946827,0.24696316 6.6965304,-0.08134 c 1.817686,-0.119544 0.03757,2.63928104 2.2366689,3.00960104 l 7.099199,-0.02236 c 2.035075,0.0017 0.607359,-2.93530304 2.426854,-2.90588004 l 9.970693,-0.04648 L 29.838118,19.76873 1.3677507,19.83845 C 0.44077471,19.839324 0.22918071,19.340052 0.23593971,18.688059 l -0.06738,-17.4068928 c -0.09179,-0.62045204 0.749669,-0.98153804 1.22610599,-1.03418804 z"
                transform="translate(15.2, 95)"
                fill="none"
                stroke="#1e1b4b"
                stroke-width="1"
            />
        {:else}
            <path
                d="M 45 95 L 45 115 L 28 115 A 3 3 0 0 1 25 112 L 25 98 A 3 3 0 0 1 28 95 Z"
                fill="none"
                stroke="#1e1b4b"
                stroke-width="1"
            />
        {/if}

        <!-- Right side -->
        {#if typeOfSlot === "2"}
            <path
                d="m 1.3946827,0.24696316 6.6965304,-0.08134 c 1.817686,-0.119544 0.03757,2.63928104 2.2366689,3.00960104 l 7.099199,-0.02236 c 2.035075,0.0017 0.607359,-2.93530304 2.426854,-2.90588004 l 9.970693,-0.04648 L 29.838118,19.76873 1.3677507,19.83845 C 0.44077471,19.839324 0.22918071,19.340052 0.23593971,18.688059 l -0.06738,-17.4068928 c -0.09179,-0.62045204 0.749669,-0.98153804 1.22610599,-1.03418804 z"
                transform="translate(281.8, 95) scale(-1, 1)"
                fill="none"
                stroke="#1e1b4b"
                stroke-width="1"
            />
        {:else}
            <path
                d="M 252 95 L 252 115 L 269 115 A 3 3 0 0 0 272 112 L 272 98 A 3 3 0 0 0 269 95 Z"
                fill="none"
                stroke="#1e1b4b"
                stroke-width="1"
            />
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
</style>
