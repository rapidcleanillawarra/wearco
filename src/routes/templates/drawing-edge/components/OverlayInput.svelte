<script lang="ts">
    // Single overlay input component positioned absolutely on PDF
    interface FieldConfig {
        id: string;
        type: string;
        label: string;
        position: { x: number; y: number; width: number; height: number };
        bindsTo: string;
        fontSize?: number;
    }

    let {
        field,
        value = $bindable(""),
        scale = 1,
    }: {
        field: FieldConfig;
        value?: string | number;
        scale?: number;
    } = $props();

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        if (field.type === "number") {
            const numValue = parseFloat(target.value);
            value = isNaN(numValue) ? 0 : numValue;
        } else {
            value = target.value;
        }
    }
</script>

<div
    class="overlay-input-wrapper"
    style="
		left: {field.position.x * scale}px;
		top: {field.position.y * scale}px;
		width: {field.position.width * scale}px;
		height: {field.position.height * scale}px;
	"
    title={field.label}
>
    <input
        type={field.type === "number" ? "number" : "text"}
        {value}
        oninput={handleInput}
        placeholder={field.label}
        style="font-size: {(field.fontSize || 12) * scale}px;"
    />
</div>

<style>
    .overlay-input-wrapper {
        position: absolute;
        z-index: 10;
    }

    input {
        width: 100%;
        height: 100%;
        padding: 2px 4px;
        border: 1px solid rgba(79, 70, 229, 0.5);
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.9);
        font-family: inherit;
        box-sizing: border-box;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        background: white;
    }

    input::placeholder {
        color: #9ca3af;
        font-size: 0.9em;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }

    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
