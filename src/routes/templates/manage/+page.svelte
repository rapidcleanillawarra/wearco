<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import TemplateEditor from "./components/TemplateEditor.svelte";

    let { data } = $props<{
        data: PageData & { signedVisualDocumentUrl?: string | null };
    }>();

    // Derive template values from props - these update when data changes
    let templateData = $derived(data.template);

    // Local editable state - initialized once from template data
    let templateName = $state("");
    let category = $state("Edge");
    let description = $state("");
    let visualDocument = $state("");
    let imageDisplay = $state("");
    let fields = $state<any[]>([]);
    let selectedFieldId = $state<string | null>(null);
    let duplicateWarning = $state(false);
    let initialized = $state(false);

    // Effect to initialize local state when template data loads or changes
    $effect(() => {
        const template = templateData;
        // Only re-initialize if templateData identity changes and we haven't initialized yet
        // or if the template ID changed (navigating to different template)
        if (template && !initialized) {
            templateName = template.template_name || "";
            category = template.category || "Edge";
            description = template.description || "";
            visualDocument = template.visual_document || "";
            imageDisplay = template.image_display || "";

            // Parse and deduplicate fields
            const rawFields = template.template_data?.fields || [];
            const seenIds = new Set<string>();
            const sanitizedFields = rawFields.map((field: any) => {
                let newId = field.id;
                let counter = 1;

                if (!newId || !newId.trim()) {
                    newId = `field_${Date.now()}`;
                }

                const originalId = newId;
                while (seenIds.has(newId)) {
                    newId = `${originalId}_${counter}`;
                    counter++;
                    duplicateWarning = true;
                }
                seenIds.add(newId);

                // Normalize targetField (support legacy targetFieldf)
                const targetField = field.targetField ?? field.targetFieldf ?? "";
                const { targetFieldf: _tf, ...rest } = field;
                return { ...rest, id: newId, targetField };
            });

            fields = sanitizedFields;
            initialized = true;
        }
    });

    $effect(() => {
        console.log("Client Data:", {
            signedVisualDocumentUrl: data.signedVisualDocumentUrl,
            visualDocument: data.template?.visual_document,
        });
    });

    let selectedField = $derived(
        selectedFieldId && selectedFieldId.trim() ? fields.find((f) => f.id === selectedFieldId) : null,
    );

    function addField() {
        const newId = `field_${Date.now()}`;
        fields.push({
            id: newId,
            type: "text",
            label: "New Field",
            fontSize: 14,
            position: {
                x: 50,
                y: 50,
                width: 100,
                height: 30,
            },
            textPosition: "left",
            targetField: "",
            prefix: "",
            suffix: "",
        });
        selectedFieldId = newId;
    }

    function removeField() {
        if (selectedFieldId) {
            fields = fields.filter((f) => f.id !== selectedFieldId);
            selectedFieldId = null;
        }
    }

    function copyField() {
        if (selectedField) {
            const newId = `field_${Date.now()}`;
            const copiedField = {
                ...selectedField,
                id: newId,
                position: {
                    ...selectedField.position,
                    x: selectedField.position.x + 20,
                    y: selectedField.position.y + 20,
                },
                prefix: selectedField.prefix || "",
                suffix: selectedField.suffix || "",
            };
            fields.push(copiedField);
            selectedFieldId = newId;
        } else {
            showToaster("error", "No field selected to copy");
        }
    }

    function updateFieldId(e: Event) {
        const input = e.target as HTMLInputElement;
        const newId = input.value.trim();

        if (selectedField) {
            // Validate that the field ID is not empty
            if (!newId) {
                showToaster("error", "Field ID cannot be empty");
                // Reset the input to the current field ID
                input.value = selectedField.id;
                return;
            }

            // Update the ID on the object
            selectedField.id = newId;
            // Immediately update the selection pointer to match so the derived store doesn't lose it
            selectedFieldId = newId;
        }
    }

    let isSaving = $state(false);

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
        <h1>{data.mode === "edit" ? "Edit Template" : "Create Template"}</h1>
        <div class="actions">
            <a href="/templates" class="btn-secondary">Cancel</a>
            <button
                type="submit"
                class="btn-primary"
                form="template-form"
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save Template"}
            </button>
        </div>
    </header>

    <div class="content-layout">
        {#if duplicateWarning}
            <div class="alert-warning">
                <strong>Warning:</strong> Duplicate field IDs were detected and
                automatically fixed. Please save the template to make these
                changes permanent.
                <button
                    class="btn-close"
                    onclick={() => (duplicateWarning = false)}>&times;</button
                >
            </div>
        {/if}
        <aside class="sidebar">
            <form
                method="POST"
                action="?/save"
                id="template-form"
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
                                    "Template saved successfully",
                            );
                            // Update the URL to include the ID for new templates without reloading
                            if (
                                result.data.id &&
                                !$page.url.searchParams.get("id")
                            ) {
                                const newUrl = new URL($page.url);
                                newUrl.searchParams.set(
                                    "id",
                                    String(result.data.id),
                                );
                                goto(newUrl.toString(), {
                                    replaceState: true,
                                    noScroll: true,
                                });
                            }
                        } else if (result.type === "failure") {
                            showToaster(
                                "error",
                                (result.data?.message as string) ||
                                    "Failed to save template",
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
                    value={data.template?.id ?? ""}
                />
                <input
                    type="hidden"
                    name="template_data"
                    value={JSON.stringify({
                        fields,
                        pageWidth: 842,
                        pageHeight: 595,
                    })}
                />

                <div class="form-group">
                    <label for="template_name">Template Name</label>
                    <input
                        type="text"
                        id="template_name"
                        name="template_name"
                        bind:value={templateName}
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="category">Category</label>
                    <select id="category" name="category" bind:value={category}>
                        <option value="Edge">Edge</option>
                        <option value="Corner">Corner</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="visual_document">PDF URL</label>
                    <input
                        type="text"
                        id="visual_document"
                        name="visual_document"
                        bind:value={visualDocument}
                        placeholder="/path/to/template.pdf"
                    />
                    <small
                        >Path to the PDF file in public directory or URL</small
                    >
                </div>

                <div class="form-group">
                    <label for="image_display">Display Image URL</label>
                    <input
                        type="text"
                        id="image_display"
                        name="image_display"
                        bind:value={imageDisplay}
                        placeholder="/path/to/preview.jpg"
                    />
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        bind:value={description}
                        rows="3"
                    ></textarea>
                </div>
            </form>

            <hr />

            <div class="field-controls">
                <h3>Fields</h3>
                <button type="button" class="btn-secondary" onclick={addField}
                    >+ Add Field</button
                >
                <button type="button" class="btn-secondary" onclick={copyField} disabled={!selectedFieldId}
                    >📋 Copy Field</button
                >

                {#if selectedField}
                    <div class="field-properties">
                        <h4>Selected: {selectedField.id}</h4>

                        <div class="form-group">
                            <label for="field_id">Field ID</label>
                            <input
                                type="text"
                                id="field_id"
                                value={selectedField.id}
                                oninput={updateFieldId}
                            />
                        </div>

                        <div class="form-group">
                            <label for="field_label">Label</label>
                            <input
                                type="text"
                                id="field_label"
                                bind:value={selectedField.label}
                            />
                        </div>

                        <div class="form-group">
                            <label for="field_type">Type</label>
                            <select
                                id="field_type"
                                bind:value={selectedField.type}
                            >
                                <option value="text">Text Input</option>
                                <option value="textarea">Text Area</option>
                                <option value="number">Number</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="field_fontsize">Font Size</label>
                            <input
                                type="number"
                                id="field_fontsize"
                                bind:value={selectedField.fontSize}
                            />
                        </div>

                        <div class="form-group">
                            <label for="field_align">Alignment</label>
                            <select
                                id="field_align"
                                bind:value={selectedField.textPosition}
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="field_targetField">Target Field</label>
                            <select
                                id="field_targetField"
                                bind:value={selectedField.targetField}
                            >
                                <option value="">None</option>
                                <option value="job_number">Job Number</option>
                                <option value="work_order">Work Order</option>
                                <option value="drawing_number">Drawing Number</option>
                                <option value="name">Name</option>
                                <option value="customer">Customer</option>
                                <option value="customer_source">Customer Source</option>
                                <option value="quantity">Quantity</option>
                                <option value="dl">DL</option>
                                <option value="checked_by">Checked By</option>
                                <option value="prog_by">Prog By</option>
                                <option value="material">Material</option>
                                <option value="thk">THK</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="field_prefix">Prefix</label>
                            <input
                                type="text"
                                id="field_prefix"
                                bind:value={selectedField.prefix}
                                placeholder="Text before field value"
                            />
                        </div>

                        <div class="form-group">
                            <label for="field_suffix">Suffix</label>
                            <input
                                type="text"
                                id="field_suffix"
                                bind:value={selectedField.suffix}
                                placeholder="Text after field value"
                            />
                        </div>

                        <button
                            type="button"
                            class="btn-danger"
                            onclick={removeField}>Delete Field</button
                        >
                    </div>
                {:else}
                    <p class="hint">
                        Select a field on the PDF to edit its properties.
                    </p>
                {/if}
            </div>
        </aside>

        <main class="editor-main">
            <TemplateEditor
                pdfUrl={data.signedVisualDocumentUrl || visualDocument}
                bind:fields
                bind:selectedFieldId
            />
        </main>
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
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .sidebar {
        width: 320px;
        background: #1e293b;
        border-right: 1px solid #334155;
        padding: 1.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .editor-main {
        flex: 1;
        background: #334155;
        overflow: hidden;
        padding: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #94a3b8;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        background: #0f172a;
        border: 1px solid #334155;
        color: white;
        padding: 0.5rem;
        border-radius: 0.375rem;
        font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        ring: 2px solid rgba(59, 130, 246, 0.2);
    }

    .form-group small {
        font-size: 0.75rem;
        color: #64748b;
    }

    hr {
        border: 0;
        border-top: 1px solid #334155;
        margin: 0;
    }

    .field-properties {
        background: #0f172a;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #334155;
    }

    .field-properties h4 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        color: #e2e8f0;
    }

    .hint {
        font-size: 0.875rem;
        color: #64748b;
        text-align: center;
        margin-top: 1rem;
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

    .btn-danger {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        width: 100%;
        margin-top: 0.5rem;
    }

    .btn-danger:hover {
        background: rgba(239, 68, 68, 0.3);
    }

    .alert-warning {
        position: absolute;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }

    .btn-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.8;
    }

    .btn-close:hover {
        opacity: 1;
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
</style>
