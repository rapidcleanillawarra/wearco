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
        const {
            position,
            fontSize = 10,
            textPosition = "left",
            rotation = 0,
        } = field;

        return `
			position: absolute;
			left: ${position.x * scaleX}px;
			top: ${position.y * scaleY}px;
			width: ${position.width * scaleX}px;
			height: ${position.height * scaleY}px;
			font-size: ${fontSize * Math.min(scaleX, scaleY)}px;
			text-align: ${textPosition};
			transform: rotate(${rotation}deg);
			transform-origin: center;
		`;
    }

    function getOptionStyle(optionPosition: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) {
        return `
			position: absolute;
			left: ${optionPosition.x * scaleX}px;
			top: ${optionPosition.y * scaleY}px;
			width: ${optionPosition.width * scaleX}px;
			height: ${optionPosition.height * scaleY}px;
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
        {:else if field.type === "radio"}
            <div
                class="radio-group"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            >
                {#each field.options || [] as option (option.value)}
                    <label
                        class="radio-option"
                        style="{getOptionStyle(
                            option.position,
                        )} transform: rotate({field.rotation || 0}deg);"
                    >
                        <input
                            type="radio"
                            name={field.id}
                            value={option.value}
                            checked={fieldValues[field.id] === option.value}
                            onchange={() =>
                                onFieldUpdate(field.id, option.value)}
                            onblur={() => onFieldBlur?.(field.id)}
                            class="radio-input"
                        />
                        <span class="radio-custom"></span>
                        <span class="radio-label">{option.label}</span>
                    </label>
                {/each}
            </div>
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

    .radio-group {
        pointer-events: none;
    }

    .radio-option {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        position: absolute;
    }

    .radio-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    .radio-custom {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        background: white;
        position: relative;
        flex-shrink: 0;
    }

    .radio-input:checked ~ .radio-custom::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
    }

    .radio-label {
        font-size: 0.9em;
        color: #1e293b;
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.7);
        padding: 0 2px;
        border-radius: 2px;
    }
</style>
