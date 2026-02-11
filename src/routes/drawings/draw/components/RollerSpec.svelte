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

    // --- Slot Configurations ---
    const SLOT_CONFIGS: Record<
        string,
        { path: string; vb: string; w: number; h: number }
    > = {
        "1": {
            path: "m 2.9549706,25.312782 6.223239,-0.03926 c 0.669443,-0.03038 1.3342384,0.46165 1.2921364,1.271451 -0.05807,1.117192 0.562383,1.647828 1.340774,1.751507 l 7.100875,-0.01963 c 0.733916,-0.06129 1.180031,-0.536457 1.29121,-1.453311 0.08652,-0.71358 0.509986,-1.429088 1.381592,-1.510756 l 9.569738,-0.0018 0.0536,19.611801 -9.822831,-0.01963 c -1.15689,-0.132755 -1.080699,-0.834405 -1.127376,-1.557006 -0.03938,-0.609744 -0.708097,-1.180906 -1.477291,-1.295068 l -6.797845,-0.01389 c -1.038299,0.08088 -1.519715,0.897642 -1.514935,1.689004 0.0041,0.677128 -0.267105,1.205207 -1.2098584,1.235793 l -6.34876,-0.0127 c -0.925822,-0.146688 -1.225207,-0.4462 -1.366821,-1.096864 l -0.02357,-17.263726 c 0.185709,-0.469704 0.22972,-1.039534 1.436127,-1.27592 z",
            vb: "0 25 30 20",
            w: 30,
            h: 20,
        },
        "2": {
            path: "m 1.3946827,0.24696316 6.6965304,-0.08134 c 1.817686,-0.119544 0.03757,2.63928104 2.2366689,3.00960104 l 7.099199,-0.02236 c 2.035075,0.0017 0.607359,-2.93530304 2.426854,-2.90588004 l 9.970693,-0.04648 L 29.838118,19.76873 1.3677507,19.83845 C 0.44077471,19.839324 0.22918071,19.340052 0.23593971,18.688059 l -0.06738,-17.4068928 c -0.09179,-0.62045204 0.749669,-0.98153804 1.22610599,-1.03418804 z",
            vb: "0 0 30 20",
            w: 30,
            h: 20,
        },
        "3": {
            path: "M 32.695641,3.21026 49.815396,3.155772 c 1.121294,-0.028895 1.241467,-0.9444672 1.247263,-1.5616953 0.0058,-0.61855213 0.421683,-1.33150165 1.385522,-1.41042947 l 9.959843,-0.0222833 1e-6,19.68949007 -10.127193,0.01066 c -2.416033,-0.483151 0.05065,-2.596906 -2.553006,-2.952311 l -17.092021,0.0075 z",
            vb: "32.5 0 30 20",
            w: 30,
            h: 20,
        },
        default: {
            path: "M 30 0 L 30 20 L 3 20 A 3 3 0 0 1 0 17 L 0 3 A 3 3 0 0 1 3 0 Z",
            vb: "0 0 30 20",
            w: 30,
            h: 20,
        },
    };

    let currentSlot = $derived(
        SLOT_CONFIGS[typeOfSlot] || SLOT_CONFIGS["default"],
    );

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
        <defs>
            <marker
                id="arrowhead-start"
                markerWidth="10"
                markerHeight="7"
                refX="0"
                refY="3.5"
                orient="auto"
            >
                <polygon points="10 0, 10 7, 0 3.5" fill="#1e1b4b" />
            </marker>
            <marker
                id="arrowhead-end"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
            >
                <polygon points="0 0, 0 7, 10 3.5" fill="#1e1b4b" />
            </marker>
        </defs>

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
            y1="30"
            x2="45"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />
        <line
            x1="252"
            y1="30"
            x2="252"
            y2="150"
            stroke="#1e1b4b"
            stroke-width="1"
        />

        <!-- Distance Arrow (face_width) -->
        <line
            x1="45"
            y1="35"
            x2="252"
            y2="35"
            stroke="#1e1b4b"
            stroke-width="1"
            stroke-dasharray="4"
            marker-start="url(#arrowhead-start)"
            marker-end="url(#arrowhead-end)"
        />
        <text
            x="148.5"
            y="30"
            text-anchor="middle"
            font-size="10"
            fill="#1e1b4b"
            font-weight="bold"
        >
            {faceWidth}
        </text>

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
        <svg
            x={45 - currentSlot.w}
            y={105 - currentSlot.h / 2}
            width={currentSlot.w}
            height={currentSlot.h}
            viewBox={currentSlot.vb}
        >
            <path
                d={currentSlot.path}
                fill="none"
                stroke="#1e1b4b"
                stroke-width="1"
            />
        </svg>

        <!-- Right side -->
        <svg
            x="252"
            y={105 - currentSlot.h / 2}
            width={currentSlot.w}
            height={currentSlot.h}
            viewBox={currentSlot.vb}
        >
            <g
                transform="translate({parseFloat(currentSlot.vb.split(' ')[0]) *
                    2 +
                    currentSlot.w}, 0) scale(-1, 1)"
            >
                <path
                    d={currentSlot.path}
                    fill="none"
                    stroke="#1e1b4b"
                    stroke-width="1"
                />
            </g>
        </svg>
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
