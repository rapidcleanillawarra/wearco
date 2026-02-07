<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import EdgeCanvas from "./components/EdgeCanvas.svelte";
    import TopSideCanvas from "./components/TopSideCanvas.svelte";
    import SearchableSelect from "./components/SearchableSelect.svelte";

    let { data, form } = $props<{
        data: PageData;
        form?: {
            success?: boolean;
            message?: string;
            id?: string;
        };
    }>();

    // Local editable state - initialized once from diagram data
    let diagramName = $state("");
    let templateId = $state("");
    let diagramType = $state("");
    let diagramDimension = $state("{}");
    let diagramVariables = $state("{}");
    let initialized = $state(false);

    const EDGE_VARIABLES = [
        "width",
        "height",
        "widthPx",
        "heightPx",
        "holeLeft",
        "holeSize",
        "holeType",
        "holeCount",
        "holeRight",
        "holeSizePx",
        "totalHoleDistance",
    ];

    // Helper to get variable values from JSON string
    let parsedVariables = $derived.by(() => {
        try {
            return JSON.parse(diagramVariables);
        } catch (e) {
            return {};
        }
    });

    // Get edge fields from selected template
    let edgeFields = $derived.by(() => {
        const template = data.templates.find((t: any) => t.id === templateId);
        if (!template?.template_data?.fields) return [];
        return template.template_data.fields
            .filter((f: any) => f.type === "edge")
            .map((f: any) => ({ id: f.id, label: f.label }));
    });

    function updateVariable(name: string, value: string) {
        const current = { ...parsedVariables };
        current[name] = value;
        diagramVariables = JSON.stringify(current, null, 2);
    }

    // Reactive mode detection from URL (stays in sync when params change during navigation)
    // Edit = only id (no template_id or type); Create = template_id + type; else invalid
    let urlMode = $derived.by(() => {
        const p = $page.url.searchParams;
        const id = (p.get("id") ?? "").trim();
        const templateId = (p.get("template_id") ?? "").trim();
        const typeParam = (p.get("type") ?? "").trim();
        if (id && !templateId && !typeParam) return "edit" as const;
        if (templateId && typeParam) return "create" as const;
        return "invalid" as const;
    });

    // Resolve current mode: use URL-derived mode when valid; server data.mode is source of truth after load
    let currentMode = $derived.by(() => {
        if (urlMode === "invalid") return "invalid";
        return data.mode;
    });

    // Edit mode flag from URL (only id, no template_id/type)
    let editMode = $derived.by(() => urlMode === "edit");

    // Get canvas type from URL parameter
    let canvasType = $derived.by(() => $page.url.searchParams.get("type"));

    // Determine which canvas component to render
    let canvasComponent = $derived.by(() => {
        const type = canvasType;
        if (type === "edge") return "edge";
        if (type === "top_side") return "top_side";
        return null;
    });

    // Redirect when URL params don't match edit or create pattern
    $effect(() => {
        if (urlMode === "invalid") {
            goto("/diagrams");
        }
    });

    // Reset initialized when navigating to a different diagram/template so init runs again
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

    // Effect to initialize local state when diagram data loads or changes
    $effect(() => {
        const diagram = data.diagram;
        const mode = data.mode;

        // Reset error state when mode changes
        diagramLoadError = null;

        // Only re-initialize if diagram data identity changes and we haven't initialized yet
        // or if the diagram ID changed (navigating to different diagram)
        if (!initialized) {
            if (mode === "create") {
                // In create mode, handle template loading if template_id is provided
                initializeCreateMode();
            } else if (mode === "edit") {
                // Edit mode - use existing diagram data
                if (diagram) {
                    isLoadingDiagram = false;
                    diagramName = diagram.name || "";
                    templateId = diagram.template_id || data.selectedTemplateId || "";
                    diagramType = diagram.type || "";
                    diagramDimension = diagram.dimension
                        ? JSON.stringify(diagram.dimension, null, 2)
                        : "{}";
                    diagramVariables = diagram.variables
                        ? JSON.stringify(diagram.variables, null, 2)
                        : "{}";
                    initialized = true;
                } else {
                    // Diagram data not available yet, show loading
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
        // Auto-hide after 4 seconds
        setTimeout(() => {
            toaster = { ...toaster, show: false };
        }, 4000);
    }

    function validateJson(value: string) {
        try {
            JSON.parse(value);
            return true;
        } catch (e) {
            return false;
        }
    }

    function formatJson(value: string) {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // Return original if invalid
            return value;
        }
    }

    // Fetch template data by ID
    async function fetchTemplate(templateId: string) {
        try {
            const response = await fetch(`/api/templates/${templateId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.statusText}`);
            }
            const template = await response.json();
            return template;
        } catch (error) {
            console.error('Error fetching template:', error);
            throw error;
        }
    }

    // Initialize form data for create mode with template_id
    async function initializeCreateMode() {
        const urlParams = $page.url.searchParams;
        const templateIdParam = urlParams.get('template_id');

        if (templateIdParam) {
            isLoadingTemplate = true;
            try {
                const template = await fetchTemplate(templateIdParam);

                // Populate form with template data
                diagramName = template.template_name || "";
                templateId = template.id;
                diagramType = template.category || "";
                diagramDimension = template.template_data?.dimension
                    ? JSON.stringify(template.template_data.dimension, null, 2)
                    : "{}";
                diagramVariables = template.template_data?.variables
                    ? JSON.stringify(template.template_data.variables, null, 2)
                    : "{}";

                showToaster("success", "Template loaded successfully");
            } catch (error) {
                console.error('Failed to load template:', error);
                showToaster("error", "Failed to load template data");
                // Initialize with empty values if template fetch fails
                diagramName = "";
                templateId = "";
                diagramType = "";
                diagramDimension = "{}";
                diagramVariables = "{}";
            } finally {
                isLoadingTemplate = false;
            }
        } else {
            // No template_id provided, initialize with empty values
            diagramName = "";
            templateId = "";
            diagramType = "";
            diagramDimension = "{}";
            diagramVariables = "{}";
        }

        initialized = true;
    }
</script>

<div class="page-container">
    {#if toaster.show}
        <div class="toaster {toaster.type}">
            <span class="toaster-icon">
                {#if toaster.type === "success"}
                    ✓
                {:else}
                    ✕
                {/if}
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
                disabled={isSaving || isLoadingTemplate || !validateJson(diagramVariables)}
            >
                {isSaving ? "Saving..." : isLoadingTemplate ? "Loading Template..." : "Save Diagram"}
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
                <strong>Error:</strong> {diagramLoadError}
                <br>
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
                    console.log("=== FORM SUBMITTING ===");
                    console.log("Form data entries:");
                    for (const [key, value] of formData.entries()) {
                        console.log(`  ${key}:`, value);
                    }
                    isSaving = true;
                    return async ({ result, update }) => {
                        isSaving = false;
                        console.log("Form result:", result);
                        console.log("Result type:", result.type);
                        if (
                            result.type !== "redirect" &&
                            result.type !== "error"
                        ) {
                            console.log("Result data:", result.data);
                        }

                        if (result.type === "success" && result.data?.success) {
                            showToaster(
                                "success",
                                (result.data.message as string) ||
                                    "Diagram saved successfully",
                            );
                            // Navigate back to diagrams list after a short delay
                            setTimeout(() => {
                                goto("/diagrams");
                            }, 1500);
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
                <input type="hidden" name="id" value={data.diagram?.id ?? ""} />

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
                                    {#if template.category}
                                        ({template.category})
                                    {/if}
                                </option>
                            {/each}
                        </select>
                        <small
                            >Select the template this diagram is associated with</small
                        >
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
                        <small>Optional diagram type classification</small>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Diagram Configuration</h2>

                    <div class="form-group">
                        <label for="dimension">Dimension (JSON)</label>
                        <div class="json-editor">
                            <textarea
                                id="dimension"
                                name="dimension"
                                bind:value={diagramDimension}
                                placeholder="Enter dimension JSON here..."
                                rows="8"
                                class:error={!validateJson(diagramDimension)}
                            ></textarea>
                            <div class="json-controls">
                                <button
                                    type="button"
                                    class="btn-secondary btn-small"
                                    onclick={() =>
                                        (diagramDimension =
                                            formatJson(diagramDimension))}
                                    disabled={!validateJson(diagramDimension)}
                                >
                                    Format JSON
                                </button>
                                {#if !validateJson(diagramDimension)}
                                    <span class="json-error"
                                        >Invalid JSON format</span
                                    >
                                {/if}
                            </div>
                        </div>
                        <small>Optional dimension configuration as JSON</small>
                    </div>

                    <div class="form-group">
                        <label for="variables">Variables (JSON) *</label>
                        <div class="json-editor">
                            <textarea
                                id="variables"
                                name="variables"
                                bind:value={diagramVariables}
                                placeholder="Enter variables JSON here..."
                                rows="15"
                                class:error={!validateJson(diagramVariables)}
                            ></textarea>
                            <div class="json-controls">
                                <button
                                    type="button"
                                    class="btn-secondary btn-small"
                                    onclick={() =>
                                        (diagramVariables =
                                            formatJson(diagramVariables))}
                                    disabled={!validateJson(diagramVariables)}
                                >
                                    Format JSON
                                </button>
                                {#if !validateJson(diagramVariables)}
                                    <span class="json-error"
                                        >Invalid JSON format</span
                                    >
                                {/if}
                            </div>
                        </div>
                        <small
                            >Enter valid JSON variables for the diagram
                            configuration</small
                        >
                    </div>
                </div>

                {#if canvasType === "edge"}
                    <div class="form-section variable-config-section">
                        <h2>Variable Configuration</h2>
                        <div class="variable-grid">
                            {#each EDGE_VARIABLES as variable}
                                <div class="variable-row">
                                    <SearchableSelect
                                        label={variable}
                                        options={edgeFields}
                                        value={parsedVariables[variable] || ""}
                                        placeholder={`Select ${variable} field...`}
                                        onselect={(val: string) =>
                                            updateVariable(variable, val)}
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Canvas Component Rendering -->
                {#if canvasComponent === "edge"}
                    <EdgeCanvas
                        width={800}
                        height={400}
                        diagramType={diagramType || "Edge Diagram"}
                    />
                {:else if canvasComponent === "top_side"}
                    <TopSideCanvas
                        width={800}
                        height={400}
                        diagramType={diagramType || "Top Side Diagram"}
                    />
                {:else}
                    <div class="canvas-error">
                        <p>
                            Invalid or missing canvas type parameter. Please
                            specify "type=edge" or "type=top_side" in the URL.
                        </p>
                        <p>
                            Example: <code>?type=edge</code> or
                            <code>?type=top_side</code>
                        </p>
                    </div>
                {/if}
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
        padding: 2rem 0;
    }

    .form-container {
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

    .variable-config-section {
        border-color: #3b82f633;
    }

    .variable-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .variable-row {
        display: flex;
        align-items: center;
        background: #1e293b;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: 1px solid #334155;
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
    .form-group select,
    .form-group textarea {
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-family: inherit;
        font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
    }

    .form-group textarea {
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        resize: vertical;
        min-height: 200px;
    }

    .form-group textarea.error {
        border-color: #ef4444;
    }

    .json-editor {
        position: relative;
    }

    .json-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
    }

    .json-error {
        color: #ef4444;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .form-group small {
        font-size: 0.75rem;
        color: #64748b;
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

    .btn-small {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
    }

    .alert {
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 8px;
        font-weight: 500;
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

    /* Toaster notifications */
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
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .toaster.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .toaster.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .toaster-icon {
        font-size: 1.25rem;
        font-weight: bold;
    }

    .toaster-message {
        font-weight: 500;
    }

    .toaster-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin-left: 0.5rem;
        line-height: 1;
        opacity: 0.8;
    }

    .toaster-close:hover {
        opacity: 1;
    }

    /* Canvas error styling */
    .canvas-error {
        background: #0f172a;
        border: 1px solid #ef4444;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-top: 1rem;
        text-align: center;
        color: #f8fafc;
    }

    .canvas-error p {
        margin: 0 0 1rem 0;
        color: #f87171;
    }

    .canvas-error code {
        background: #1e293b;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        color: #3b82f6;
    }

    /* Loading states */
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        margin: 2rem 0;
        text-align: center;
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
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .loading-container p {
        color: #94a3b8;
        font-size: 1rem;
        margin: 0;
    }
</style>
