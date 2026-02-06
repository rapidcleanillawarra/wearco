<script lang="ts">
    import type { WearcoTemplate } from "$lib/types/template";
    import { enhance } from "$app/forms";
    import { fade, scale } from "svelte/transition";

    let { template, onClose } = $props<{
        template: WearcoTemplate | null;
        onClose: () => void;
    }>();

    let isSaving = $state(false);

    // Initial form values from template if editing
    let name = $state(template?.template_name || "");
    let category = $state(template?.category || "");
    let description = $state(template?.description || "");
    let imageDisplay = $state(template?.image_display || "");
</script>

<div class="modal-backdrop" onclick={onClose} transition:fade>
    <div
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
        transition:scale={{ start: 0.95 }}
    >
        <div class="modal-header">
            <h2>{template ? "Edit Template" : "New Template"}</h2>
            <button class="close-btn" onclick={onClose}>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <form
            method="POST"
            action="?/saveTemplate"
            use:enhance={() => {
                isSaving = true;
                return async ({ result, update }) => {
                    await update();
                    isSaving = false;
                    if (result.type === "success") {
                        onClose();
                    }
                };
            }}
        >
            {#if template}
                <input type="hidden" name="id" value={template.id} />
            {/if}

            <div class="form-group">
                <label for="name">Template Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    bind:value={name}
                    required
                    placeholder="e.g. Standard Bucket"
                />
            </div>

            <div class="form-group">
                <label for="category">Category</label>
                <input
                    type="text"
                    id="category"
                    name="category"
                    bind:value={category}
                    placeholder="e.g. Buckets"
                />
            </div>

            <div class="form-group">
                <label for="imageDisplay">Image URL</label>
                <input
                    type="text"
                    id="imageDisplay"
                    name="imageDisplay"
                    bind:value={imageDisplay}
                    placeholder="https://..."
                />
                {#if imageDisplay}
                    <div class="image-preview">
                        <img
                            src={imageDisplay}
                            alt="Preview"
                            onerror={(e) =>
                                (e.currentTarget.style.display = "none")}
                        />
                    </div>
                {/if}
            </div>

            <div class="form-group">
                <label for="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    bind:value={description}
                    rows="3"
                    placeholder="Describe this template..."
                ></textarea>
            </div>

            <div class="modal-actions">
                <button type="button" class="cancel-btn" onclick={onClose}>
                    Cancel
                </button>
                <button type="submit" class="save-btn" disabled={isSaving}>
                    {isSaving
                        ? "Saving..."
                        : template
                          ? "Update Template"
                          : "Create Template"}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-content {
        background: #1e1e1e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        padding: 2rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--color-white);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--color-gray);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        color: var(--color-white);
        background: rgba(255, 255, 255, 0.1);
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--color-gray);
        font-size: 0.9rem;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: var(--color-white);
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--color-gold);
    }

    .image-preview {
        margin-top: 0.5rem;
        border-radius: 8px;
        overflow: hidden;
        max-height: 150px;
        background: rgba(0, 0, 0, 0.2);
    }

    .image-preview img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .cancel-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--color-white);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .save-btn {
        background: var(--color-gold);
        color: var(--color-black);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .save-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
    }

    .save-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
