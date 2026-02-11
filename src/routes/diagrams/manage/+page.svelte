<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import SearchableSelect from "./components/SearchableSelect.svelte";

    let { data, form } = $props<{
        data: PageData;
        form?: {
            success?: boolean;
            message?: string;
            id?: string;
        };
    }>();

    // Dynamic variables state
    let variables = $state<Record<string, string>>({});
    let newVariableName = $state("");
    let newVariableValue = $state("");
    let showAddVariableForm = $state(false);
    let isSubmittingVariable = $state(false);
    let variableErrors = $state<Record<string, string>>({});

    // Local editable state - initialized once from diagram data
    let diagramName = $state("");
    let templateId = $state("");
    let diagramType = $state("");
    let diagramDimension = $state("{}");
    let diagramVariables = $state("{}");
    let initialized = $state(false);

    // Dimension state variables
    let dimensionHeight = $state("0");
    let dimensionWidth = $state("0");

    // Get all fields from selected template (prefer server template data, fallback to templates array)
    let edgeFields = $derived.by(() => {
        // Prefer template from server data (for edit mode), fallback to finding in templates array
        let template = data.template;
        if (!template) {
            template = data.templates.find((t: any) => t.id === templateId);
        }
        if (!template?.template_data?.fields) return [];
        return template.template_data.fields.map((f: any) => ({
            id: f.id,
            label: f.label,
        }));
    });

    // Variable CRUD functions
    function addVariable() {
        if (isSubmittingVariable || !newVariableName.trim()) {
            return;
        }

        if (!newVariableName.trim()) {
            showToaster("error", "Variable name is required");
            return;
        }

        if (variables[newVariableName.trim()]) {
            showToaster("error", "Variable name must be unique");
            return;
        }

        isSubmittingVariable = true;

        try {
            variables = {
                ...variables,
                [newVariableName.trim()]: newVariableValue,
            };

            newVariableName = "";
            newVariableValue = "";
            showToaster("success", "Variable added successfully");
        } catch (error) {
            console.error("Error adding variable:", error);
            showToaster("error", "Failed to add variable");
        } finally {
            isSubmittingVariable = false;
        }
    }

    function updateVariable(name: string, value: string) {
        try {
            variables = {
                ...variables,
                [name]: value,
            };
            showToaster("success", "Variable updated successfully");
        } catch (error) {
            console.error("Error updating variable:", error);
            showToaster("error", "Failed to update variable");
        }
    }

    function deleteVariable(name: string) {
        if (
            !confirm(`Are you sure you want to delete the variable "${name}"?`)
        ) {
            return;
        }

        try {
            const newVariables = { ...variables };
            delete newVariables[name];
            variables = newVariables;
            showToaster("success", "Variable deleted successfully");
        } catch (error) {
            console.error("Error deleting variable:", error);
            showToaster("error", "Failed to delete variable");
        }
    }

    // Reactive mode detection from URL
    let urlMode = $derived.by(() => {
        const p = $page.url.searchParams;
        const id = (p.get("id") ?? "").trim();
        const templateId = (p.get("template_id") ?? "").trim();
        const typeParam = (p.get("type") ?? "").trim();
        if (id && !templateId && !typeParam) return "edit" as const;
        if (templateId && typeParam) return "create" as const;
        return "invalid" as const;
    });

    // Redirect when URL params don't match
    $effect(() => {
        if (urlMode === "invalid") {
            goto("/diagrams");
        }
    });

    // Reset initialized when navigating to a different diagram/template
    let lastInitKey = $state<string | null>(null);
    $effect(() => {
        const mode = data.mode;
        const key =
            mode === "edit"
                ? (data.diagram?.id ?? "")
                : ($page.url.searchParams.get("template_id") ?? "");
        if (lastInitKey !== null && lastInitKey !== key) {
            initialized = false;
        }
        lastInitKey = key;
    });

    // Initialize variables from data when it loads
    $effect(() => {
        if (data.variables) {
            variables = data.variables;
        }
    });

    // Update diagramDimension JSON when height/width change
    $effect(() => {
        const height = parseFloat(dimensionHeight) || 0;
        const width = parseFloat(dimensionWidth) || 0;
        diagramDimension = JSON.stringify({ height, width }, null, 2);
    });

    // Effect to initialize local state when diagram data loads
    $effect(() => {
        const diagram = data.diagram;
        const mode = data.mode;

        if (!initialized) {
            if (mode === "create") {
                initializeCreateMode();
            } else if (mode === "edit") {
                if (diagram) {
                    isLoadingDiagram = false;
                    diagramName = diagram.name || "";
                    templateId =
                        diagram.template_id || data.selectedTemplateId || "";
                    diagramType = diagram.type || "";
                    diagramDimension = diagram.dimension
                        ? JSON.stringify(diagram.dimension, null, 2)
                        : "{}";
                    if (diagram.dimension) {
                        dimensionHeight =
                            diagram.dimension.height?.toString() || "0";
                        dimensionWidth =
                            diagram.dimension.width?.toString() || "0";
                    }
                    diagramVariables = diagram.variables
                        ? JSON.stringify(diagram.variables, null, 2)
                        : "{}";
                    variables = data.variables || {};
                    initialized = true;
                } else {
                    isLoadingDiagram = true;
                }
            }
        }
    });

    let isSaving = $state(false);
    let isLoadingTemplate = $state(false);
    let isLoadingDiagram = $state(false);
    let diagramLoadError = $state<string | null>(null);

    // Toaster notification state
    let toaster = $state<{
        show: boolean;
        type: "success" | "error";
        message: string;
    }>({
        show: false,
        type: "success",
        message: "",
    });

    function showToaster(type: "success" | "error", message: string) {
        toaster = { show: true, type, message };
        setTimeout(() => {
            toaster = { ...toaster, show: false };
        }, 4000);
    }

    // Fetch template data by ID
    async function fetchTemplate(templateId: string) {
        try {
            const response = await fetch(`/api/templates/${templateId}`);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch template: ${response.statusText}`,
                );
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching template:", error);
            throw error;
        }
    }

    // Initialize form data for create mode with template_id
    async function initializeCreateMode() {
        const urlParams = $page.url.searchParams;
        const templateIdParam = urlParams.get("template_id");
        const typeParam = urlParams.get("type");

        if (templateIdParam) {
            isLoadingTemplate = true;
            try {
                const template = await fetchTemplate(templateIdParam);
                diagramName = template.template_name || "";
                templateId = template.id;
                diagramType = typeParam || template.category || "";
                diagramDimension = template.template_data?.dimension
                    ? JSON.stringify(template.template_data.dimension, null, 2)
                    : "{}";
                if (template.template_data?.dimension) {
                    dimensionHeight =
                        template.template_data.dimension.height?.toString() ||
                        "0";
                    dimensionWidth =
                        template.template_data.dimension.width?.toString() ||
                        "0";
                }
                diagramVariables = template.template_data?.variables
                    ? JSON.stringify(template.template_data.variables, null, 2)
                    : "{}";
                variables = template.template_data?.variables || {};
                showToaster("success", "Template loaded successfully");
            } catch (error) {
                console.error("Failed to load template:", error);
                showToaster("error", "Failed to load template data");
                diagramName = "";
                templateId = "";
                diagramType = "";
                diagramDimension = "{}";
                diagramVariables = "{}";
                variables = {};
            } finally {
                isLoadingTemplate = false;
            }
        }
        initialized = true;
    }
</script>

<div class="page-container">
    {#if toaster.show}
        <div class="toaster {toaster.type}">
            <span class="toaster-icon">
                {#if toaster.type === "success"}✓{:else}✕{/if}
            </span>
            <span class="toaster-message">{toaster.message}</span>
            <button
                class="toaster-close"
                onclick={() => (toaster = { ...toaster, show: false })}
                >&times;</button
            >
        </div>
    {/if}

    <header class="page-header">
        <h1>{data.mode === "edit" ? "Edit Diagram" : "Create Diagram"}</h1>
        <div class="actions">
            <a href="/diagrams" class="btn-secondary">Cancel</a>
            <button
                type="submit"
                class="btn-primary"
                form="diagram-form"
                disabled={isSaving || isLoadingTemplate}
            >
                {isSaving
                    ? "Saving..."
                    : isLoadingTemplate
                      ? "Loading Template..."
                      : "Save Diagram"}
            </button>
        </div>
    </header>

    <div class="content-layout">
        {#if isLoadingDiagram}
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading diagram data...</p>
            </div>
        {:else if diagramLoadError}
            <div class="alert error">
                <strong>Error:</strong>
                {diagramLoadError}<br />
                <small>Please check the diagram ID and try again.</small>
            </div>
        {:else if form?.message}
            <div
                class="alert"
                class:success={form.success}
                class:error={!form.success}
            >
                {form.message}
            </div>
        {/if}

        {#if !isLoadingDiagram && !diagramLoadError}
            <div class="form-container">
                <form
                    method="POST"
                    action="?/saveDiagram"
                    id="diagram-form"
                    use:enhance={({ formData }) => {
                        formData.append("variables", JSON.stringify(variables));
                        const dimension = {
                            height: parseFloat(dimensionHeight) || 0,
                            width: parseFloat(dimensionWidth) || 0,
                        };
                        formData.append("dimension", JSON.stringify(dimension));
                        isSaving = true;
                        return async ({ result }) => {
                            isSaving = false;
                            if (
                                result.type === "success" &&
                                result.data?.success
                            ) {
                                showToaster(
                                    "success",
                                    (result.data.message as string) ||
                                        "Diagram saved successfully",
                                );
                                setTimeout(() => goto("/diagrams"), 1500);
                            } else if (result.type === "failure") {
                                showToaster(
                                    "error",
                                    (result.data?.message as string) ||
                                        "Failed to save diagram",
                                );
                            } else if (result.type === "error") {
                                showToaster(
                                    "error",
                                    "An unexpected error occurred",
                                );
                            }
                        };
                    }}
                >
                    <input
                        type="hidden"
                        name="id"
                        value={data.diagram?.id ?? ""}
                    />

                    <div class="form-section">
                        <h2>Diagram Details</h2>
                        <div class="form-group">
                            <label for="name">Diagram Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                bind:value={diagramName}
                                required
                                placeholder="Enter diagram name"
                            />
                        </div>

                        <div class="form-group">
                            <label for="template_id">Template *</label>
                            <select
                                id="template_id"
                                name="template_id"
                                bind:value={templateId}
                                required
                            >
                                <option value="">Select a template...</option>
                                {#each data.templates as template}
                                    <option value={template.id}>
                                        {template.template_name}
                                        {#if template.category}({template.category}){/if}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="type">Type</label>
                            <input
                                type="text"
                                id="type"
                                name="type"
                                bind:value={diagramType}
                                placeholder="Enter diagram type"
                            />
                        </div>
                    </div>

                    <div class="form-section dimension-section">
                        <h2>Dimension</h2>
                        <div class="form-group">
                            <label for="dimension_height">Height</label>
                            <input
                                type="number"
                                id="dimension_height"
                                bind:value={dimensionHeight}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div class="form-group">
                            <label for="dimension_width">Width</label>
                            <input
                                type="number"
                                id="dimension_width"
                                bind:value={dimensionWidth}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div class="form-section variable-config-section">
                        <div class="variable-header">
                            <h2>Variable Configuration</h2>
                            <button
                                type="button"
                                class="btn-add-variable"
                                onclick={() =>
                                    (showAddVariableForm =
                                        !showAddVariableForm)}
                                disabled={showAddVariableForm}
                            >
                                {showAddVariableForm
                                    ? "Cancel"
                                    : "+ Add Variable"}
                            </button>
                        </div>

                        {#if showAddVariableForm}
                            <div class="add-variable-form">
                                <div class="variable-row new-variable-row">
                                    <input
                                        type="text"
                                        placeholder="Variable name"
                                        bind:value={newVariableName}
                                        class="variable-name-input"
                                        maxlength="50"
                                    />
                                    <SearchableSelect
                                        options={edgeFields}
                                        bind:value={newVariableValue}
                                        placeholder="Select field..."
                                        onselect={(val) =>
                                            (newVariableName = val)}
                                    />
                                    <button
                                        type="button"
                                        class="btn-save-variable"
                                        onclick={addVariable}
                                        disabled={isSubmittingVariable ||
                                            !newVariableName.trim()}
                                    >
                                        {isSubmittingVariable
                                            ? "Adding..."
                                            : "Add"}
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-cancel-variable"
                                        onclick={() => {
                                            showAddVariableForm = false;
                                            newVariableName = "";
                                            newVariableValue = "";
                                        }}>Cancel</button
                                    >
                                </div>
                            </div>
                        {/if}

                        <div class="variable-grid">
                            {#each Object.entries(variables) as [name, value]}
                                <div class="variable-row existing-variable-row">
                                    <div class="variable-name-display">
                                        <strong>{name}</strong>
                                    </div>
                                    <SearchableSelect
                                        options={edgeFields}
                                        {value}
                                        placeholder={`Select ${name} field...`}
                                        onselect={(val) =>
                                            updateVariable(name, val)}
                                    />
                                    <button
                                        type="button"
                                        class="btn-delete-variable"
                                        onclick={() => deleteVariable(name)}
                                        >✕</button
                                    >
                                </div>
                            {/each}
                            {#if Object.keys(variables).length === 0}
                                <div class="no-variables">
                                    <p>No variables configured yet.</p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </form>
            </div>
        {/if}
    </div>
</div>

<style>
    .page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #1e293b;
        color: #f8fafc;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #0f172a;
        border-bottom: 1px solid #334155;
    }

    .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .actions {
        display: flex;
        gap: 1rem;
    }

    .content-layout {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        display: flex;
        justify-content: center;
    }

    .form-container {
        max-width: 800px;
        width: 100%;
    }

    .form-section {
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-section h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #94a3b8;
    }

    .form-group input,
    .form-group select {
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-family: inherit;
        font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
        background: #2563eb;
    }

    .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .alert {
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    .alert.success {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .alert.error {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .toaster {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .toaster.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }

    .toaster.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }

    .toaster-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.8;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        text-align: center;
        width: 100%;
        max-width: 800px;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #334155;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .variable-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .btn-add-variable {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        cursor: pointer;
    }

    .add-variable-form {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .variable-row {
        display: grid;
        grid-template-columns: 1fr 2fr auto;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .new-variable-row {
        grid-template-columns: 1fr 2fr auto auto;
    }

    .variable-name-input {
        background: #0f172a;
        border: 1px solid #334155;
        color: white;
        padding: 0.75rem;
        border-radius: 0.375rem;
    }

    .btn-save-variable {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
    }

    .btn-cancel-variable {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
    }

    .existing-variable-row {
        background: #1e293b;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        border: 1px solid #334155;
    }

    .btn-delete-variable {
        background: #ef4444;
        color: white;
        border: none;
        width: 2rem;
        height: 2rem;
        border-radius: 0.25rem;
        cursor: pointer;
    }
</style>
