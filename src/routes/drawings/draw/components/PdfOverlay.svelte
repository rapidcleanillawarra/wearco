<script lang="ts">
    import type { TemplateField } from "../types";

    let {
        fields = [],
        templateWidth,
        templateHeight,
        pdfWidth,
        pdfHeight,
        fieldValues = {},
        onFieldUpdate,
        onFieldBlur,
    } = $props<{
        fields: TemplateField[];
        templateWidth: number;
        templateHeight: number;
        pdfWidth: number;
        pdfHeight: number;
        fieldValues: Record<string, string>;
        onFieldUpdate: (fieldId: string, value: string) => void;
        onFieldBlur?: (fieldId: string) => void;
    }>();

    // Calculate scale factors
    const scaleX = $derived(pdfWidth / templateWidth);
    const scaleY = $derived(pdfHeight / templateHeight);

    function handleInput(fieldId: string, event: Event) {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
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

<div class="pdf-overlay">
    {#each fields as field (field.id)}
        {#if field.type === "textarea"}
            <textarea
                id={field.id}
                value={fieldValues[field.id] || ""}
                oninput={(e) => handleInput(field.id, e)}
                onblur={() => onFieldBlur?.(field.id)}
                style={getFieldStyle(field)}
                class="overlay-input overlay-textarea"
                placeholder={field.label}
            ></textarea>
        {:else}
            <input
                type={field.type === "number" ? "number" : "text"}
                id={field.id}
                value={fieldValues[field.id] ?? ""}
                oninput={(e) => handleInput(field.id, e)}
                onblur={() => onFieldBlur?.(field.id)}
                style={getFieldStyle(field)}
                class="overlay-input"
                placeholder={field.label}
            />
        {/if}
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

    .overlay-textarea {
        resize: none;
    }
</style>
