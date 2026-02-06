<script lang="ts">
    import type { TemplateField } from "../types";

    let {
        fields = [],
        templateWidth,
        templateHeight,
        fieldValues = {},
        onFieldUpdate,
    } = $props<{
        fields: TemplateField[];
        templateWidth: number;
        templateHeight: number;
        fieldValues: Record<string, string>;
        onFieldUpdate: (fieldId: string, value: string) => void;
    }>();

    // Self-measure PDF dimensions from parent container
    let containerElement: HTMLDivElement | undefined;
    let pdfWidth = $state(0);
    let pdfHeight = $state(0);

    // Update dimensions when container mounts or changes
    $effect(() => {
        if (containerElement) {
            const updateDimensions = () => {
                if (containerElement) {
                    pdfWidth = containerElement.offsetWidth;
                    pdfHeight = containerElement.offsetHeight;
                }
            };
            updateDimensions();

            // Update on resize
            const resizeObserver = new ResizeObserver(updateDimensions);
            resizeObserver.observe(containerElement);

            return () => {
                resizeObserver.disconnect();
            };
        }
    });

    // Calculate scale factors
    const scaleX = $derived(pdfWidth / templateWidth);
    const scaleY = $derived(pdfHeight / templateHeight);

    function handleInput(fieldId: string, event: Event) {
        const target = event.target as HTMLInputElement;
        onFieldUpdate(fieldId, target.value);
    }

    function getFieldStyle(field: TemplateField) {
        const { position, fontSize = 10, textPosition = "left" } = field;

        return `
			position: absolute;
			left: ${position.x * scaleX}px;
			top: ${position.y * scaleY}px;
			width: ${position.width * scaleX}px;
			height: ${position.height * scaleY}px;
			font-size: ${fontSize * Math.min(scaleX, scaleY)}px;
			text-align: ${textPosition};
		`;
    }
</script>

<div bind:this={containerElement} class="pdf-overlay">
    {#each fields as field (field.id)}
        <input
            type="text"
            id={field.id}
            value={fieldValues[field.id] || ""}
            oninput={(e) => handleInput(field.id, e)}
            style={getFieldStyle(field)}
            class="overlay-input"
            placeholder={field.label}
        />
    {/each}
</div>

<style>
    .pdf-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .overlay-input {
        pointer-events: auto;
        border: 1px solid rgba(59, 130, 246, 0.5);
        background: rgba(255, 255, 255, 0.9);
        padding: 2px 4px;
        border-radius: 2px;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .overlay-input:focus {
        border-color: #3b82f6;
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .overlay-input:hover {
        border-color: #3b82f6;
    }
</style>
