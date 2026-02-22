<script lang="ts">
    import type { WearcoDiagram } from "$lib/types/svg_diagram";
    import ViewEdgeDiagram from "./ViewEdgeDiagram.svelte";
    import ViewRollerSpec from "./ViewRollerSpec.svelte";

    let {
        diagram,
        fieldValues = {},
        pitchConfigs = [],
    } = $props<{
        diagram: WearcoDiagram | null;
        fieldValues?: Record<string, string>;
        pitchConfigs?: Array<{
            from: number;
            to: number;
            prefix?: string;
            suffix?: string;
            label?: string;
        }>;
    }>();

    let originalSvgContent = $state<string>("");
    let dynamicSvgContent = $state<string>("");

    $effect(() => {
        if (!diagram?.signedUrl) {
            originalSvgContent = "";
            return;
        }

        const fetchSvg = async () => {
            try {
                const response = await fetch(diagram.signedUrl!);
                if (response.ok) {
                    originalSvgContent = await response.text();
                }
            } catch (err) {
                console.error("Failed to fetch SVG:", err);
            }
        };

        fetchSvg();
    });

    const updatedSvgContent = $derived.by(() => {
        if (!originalSvgContent) return "";
        if (Object.keys(fieldValues).length === 0) return originalSvgContent;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(originalSvgContent, "image/svg+xml");

            Object.entries(fieldValues).forEach(([id, val]) => {
                const value = String(val);
                const element = doc.getElementById(id);
                if (element) {
                    const tag = element.tagName.toLowerCase();
                    if (tag === "text" || tag === "tspan") {
                        const tspans = element.querySelectorAll("tspan");
                        if (tag === "text" && tspans.length > 0) {
                            const firstTspan = tspans[0];
                            const originalText = firstTspan.textContent || "";
                            const hasMM = originalText.toLowerCase().includes("mm");
                            firstTspan.textContent = hasMM ? `${value} mm` : value;
                        } else {
                            const originalText = element.textContent || "";
                            const hasMM = originalText.toLowerCase().includes("mm");
                            element.textContent = hasMM ? `${value} mm` : value;
                        }
                    }
                }
            });

            return new XMLSerializer().serializeToString(doc);
        } catch (err) {
            console.error("Error updating SVG text:", err);
            return originalSvgContent;
        }
    });
</script>

{#if diagram}
    <div class="view-diagram">
        {#if diagram.type === "edge"}
            <ViewEdgeDiagram
                {fieldValues}
                variables={diagram.variables}
                name={diagram.name}
                {pitchConfigs}
                bind:svgString={dynamicSvgContent}
            />
        {:else if diagram.type === "roller_spec"}
            <ViewRollerSpec
                {fieldValues}
                variables={diagram.variables}
                name={diagram.name}
                bind:svgString={dynamicSvgContent}
            />
        {:else if updatedSvgContent}
            <div class="static-svg">
                {@html updatedSvgContent}
            </div>
        {/if}
    </div>
{/if}

<style>
    .view-diagram {
        width: 100%;
        background: white;
    }

    .static-svg {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .static-svg :global(svg) {
        max-width: 100%;
        height: auto;
    }
</style>
