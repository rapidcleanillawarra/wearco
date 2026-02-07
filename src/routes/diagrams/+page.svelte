<script lang="ts">
    import { goto } from "$app/navigation";
    import type { WearcoSvgDiagram } from "$lib/types/svg_diagram";
    import DiagramCard from "./components/DiagramCard.svelte";
    import DiagramRow from "./components/DiagramRow.svelte";
    import { fade } from "svelte/transition";

    import type { WearcoTemplate } from '$lib/types/template';

    let { data, form } = $props<{
        data: {
            diagrams: (WearcoSvgDiagram & {
                wearco_templates?: {
                    template_name: string;
                    category: string;
                };
            })[];
            templates: WearcoTemplate[];
            error?: string;
        };
        form?: {
            success?: boolean;
            message?: string;
        };
    }>();

    const diagrams = $derived(data.diagrams ?? []);
    const loadError = $derived(data.error);

    let viewMode: "card" | "list" = $state("card");
    let searchQuery = $state("");
    let selectedTemplate = $state("all");
    let showCreateModal = $state(false);
    let selectedTemplateId = $state<string>("");
    let selectedDiagramType = $state<"edge" | "top_side" | "">("");

    // Derived state for filtering
    const uniqueTemplates = $derived([
        "all",
        ...new Set(diagrams.map((d: (WearcoSvgDiagram & {
            wearco_templates?: {
                template_name: string;
                category: string;
            };
        })) => d.wearco_templates?.template_name).filter(Boolean)),
    ]);

    const filteredDiagrams = $derived(
        diagrams.filter((d: (WearcoSvgDiagram & {
            wearco_templates?: {
                template_name: string;
                category: string;
            };
        })) => {
            const matchesSearch =
                d.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (d.wearco_templates?.template_name || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesTemplate =
                selectedTemplate === "all" || d.wearco_templates?.template_name === selectedTemplate;
            return matchesSearch && matchesTemplate;
        }),
    );

    function openCreateModal() {
        showCreateModal = true;
        selectedTemplateId = "";
        selectedDiagramType = "";
    }

    function confirmCreateDiagram() {
        if (!selectedTemplateId || !selectedDiagramType) {
            return; // Don't close modal if selections are incomplete
        }
        showCreateModal = false;
        goto(`/diagrams/manage?template_id=${selectedTemplateId}&type=${selectedDiagramType}`);
    }

    function closeCreateModal() {
        showCreateModal = false;
        selectedTemplateId = "";
        selectedDiagramType = "";
    }

    function openEditModal(diagram: WearcoSvgDiagram) {
        goto(`/diagrams/manage?id=${diagram.id}`);
    }
</script>

<div class="page-container-dark diagrams-page">
    <div class="page-header" in:fade={{ duration: 300, delay: 100 }}>
        <div class="header-content">
            <div class="title-section">
                <h1>Diagrams</h1>
                <p class="subtitle">
                    Manage and organize your SVG diagrams
                </p>
            </div>
            <button class="create-btn" onclick={openCreateModal}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Diagram
            </button>
        </div>

        <div class="controls-bar">
            <div class="search-filters">
                <div class="search-box">
                    <span class="search-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search diagrams..."
                        bind:value={searchQuery}
                    />
                </div>

                <div class="template-filter">
                    <select bind:value={selectedTemplate}>
                        {#each uniqueTemplates as template}
                            <option value={template}>
                                {template === "all"
                                    ? "All Templates"
                                    : template}
                            </option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="view-toggles">
                <button
                    class="toggle-btn"
                    class:active={viewMode === "card"}
                    onclick={() => (viewMode = "card")}
                    title="Grid View"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>
                <button
                    class="toggle-btn"
                    class:active={viewMode === "list"}
                    onclick={() => (viewMode = "list")}
                    title="List View"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    {#if form?.message}
        <div
            class="alert"
            class:success={form.success}
            class:error={!form.success}
            transition:fade
        >
            {form.message}
        </div>
    {/if}

    {#if loadError}
        <div class="alert error" transition:fade>
            Error loading diagrams: {loadError}
        </div>
    {/if}

    {#if filteredDiagrams.length === 0}
        <div class="empty-state" in:fade>
            <h3>No diagrams found</h3>
            <p>
                {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Create your first diagram to get started"}
            </p>
            {#if !searchQuery && selectedTemplate === "all"}
                <button
                    class="create-btn"
                    style="margin: 1rem auto;"
                    onclick={openCreateModal}
                >
                    Create Diagram
                </button>
            {/if}
        </div>
    {:else if viewMode === "card"}
        <div class="cards-grid" in:fade>
            {#each filteredDiagrams as diagram, index (diagram.id)}
                <DiagramCard
                    {diagram}
                    {index}
                    onEdit={() => openEditModal(diagram)}
                />
            {/each}
        </div>
    {:else}
        <div class="list-container" in:fade>
            <div class="list-header">
                <div>Name</div>
                <div>Template</div>
                <div>Created</div>
                <div>Last Updated</div>
                <div style="text-align: right">Actions</div>
            </div>
            {#each filteredDiagrams as diagram, index (diagram.id)}
                <DiagramRow
                    {diagram}
                    {index}
                    onEdit={() => openEditModal(diagram)}
                />
            {/each}
        </div>
    {/if}
</div>

{#if showCreateModal}
    <!-- Modal Backdrop -->
    <div class="modal-backdrop" onclick={closeCreateModal} onkeydown={(e) => { if (e.key === 'Escape') closeCreateModal(); }} role="presentation" tabindex="-1"></div>

    <!-- Modal Dialog -->
    <div class="modal-dialog" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
        <div class="modal-header">
            <h2 id="modal-title">Create New Diagram</h2>
            <button class="modal-close" onclick={closeCreateModal} aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <div class="modal-content">
            <p id="modal-description" class="modal-description">
                Choose a template and diagram type to create your new diagram:
            </p>

            {#if data.templates && data.templates.length > 0}
                <div class="selections-container">
                    <div class="template-selector">
                        <label for="template-select" class="template-label">Template:</label>
                        <select
                            id="template-select"
                            bind:value={selectedTemplateId}
                            class="template-dropdown"
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
                    </div>

                    <div class="type-selector">
                        <div class="type-label" id="type-label">Diagram Type:</div>
                        <div class="diagram-type-options" role="radiogroup" aria-labelledby="type-label">
                            <button
                                class="diagram-type-option"
                                class:selected={selectedDiagramType === 'edge'}
                                onclick={() => selectedDiagramType = 'edge'}
                                role="radio"
                                aria-checked={selectedDiagramType === 'edge'}
                                aria-label="Edge Diagram"
                            >
                                <div class="option-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                    </svg>
                                </div>
                                <h3>Edge Diagram</h3>
                                <p>Create a diagram for edge configurations and layouts</p>
                            </button>

                            <button
                                class="diagram-type-option"
                                class:selected={selectedDiagramType === 'top_side'}
                                onclick={() => selectedDiagramType = 'top_side'}
                                role="radio"
                                aria-checked={selectedDiagramType === 'top_side'}
                                aria-label="Top Side Diagram"
                            >
                                <div class="option-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <rect x="7" y="7" width="3" height="3"></rect>
                                        <rect x="14" y="7" width="3" height="3"></rect>
                                        <rect x="7" y="14" width="3" height="3"></rect>
                                        <rect x="14" y="14" width="3" height="3"></rect>
                                    </svg>
                                </div>
                                <h3>Top Side Diagram</h3>
                                <p>Create a diagram for top-side layouts and designs</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button
                        class="cancel-btn"
                        onclick={closeCreateModal}
                    >
                        Cancel
                    </button>
                    <button
                        class="confirm-btn"
                        onclick={confirmCreateDiagram}
                        disabled={!selectedTemplateId || !selectedDiagramType}
                    >
                        Create Diagram
                    </button>
                </div>
            {:else}
                <div class="loading-error">
                    <p class="error-message">
                        {#if data.error && data.error.includes('templates')}
                            Failed to load templates. Please try again.
                        {:else}
                            No templates available. Please create a template first.
                        {/if}
                    </p>
                    <button class="retry-btn" onclick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    /* Reuse global styles and specific page styles similar to Templates page */
    .diagrams-page {
        min-height: 100vh;
        background: var(--gradient-dark);
        color: var(--color-white);
        padding: var(--spacing-xl) var(--spacing-2xl);
        font-family: var(--font-primary);
    }

    .page-header {
        margin-bottom: var(--spacing-xl);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
    }

    .title-section h1 {
        font-size: var(--font-size-4xl);
        font-weight: var(--font-weight-bold);
        margin: 0;
        background: var(--gradient-title);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        color: var(--color-gray);
        margin: var(--spacing-xs) 0 0 0;
    }

    .create-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--color-gold);
        color: var(--color-black);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .create-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
    }

    .controls-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .search-filters {
        display: flex;
        gap: 1rem;
        flex: 1;
    }

    .search-box {
        position: relative;
        width: 300px;
    }

    .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-gray);
    }

    .search-box input {
        width: 100%;
        padding: 0.6rem 1rem 0.6rem 2.5rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: var(--color-white);
        font-size: 0.9rem;
    }

    .search-box input:focus {
        border-color: var(--color-gold);
        outline: none;
    }

    .template-filter select {
        padding: 0.6rem 2rem 0.6rem 1rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: var(--color-white);
        font-size: 0.9rem;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.7rem center;
    }

    .view-toggles {
        display: flex;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 4px;
        border-radius: 8px;
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        color: var(--color-gray);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .toggle-btn:hover {
        color: var(--color-white);
    }

    .toggle-btn.active {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-gold);
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--spacing-lg);
    }

    .list-container {
        background: rgba(20, 20, 20, 0.6);
        border: var(--border-subtle);
        border-radius: var(--radius-2xl);
        overflow: hidden;
    }

    .list-header {
        display: grid;
        grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
        gap: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        background: rgba(0, 0, 0, 0.3);
        border-bottom: var(--border-subtle);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-gray);
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .empty-state h3 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: var(--color-white);
    }

    .empty-state p {
        color: var(--color-gray);
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

    @media (max-width: 768px) {
        .diagrams-page {
            padding: var(--spacing-md);
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .controls-bar {
            flex-direction: column;
            gap: 1rem;
        }

        .search-filters {
            flex-direction: column;
            width: 100%;
        }

        .search-box {
            width: 100%;
        }

        .template-filter select {
            width: 100%;
        }

        .list-header {
            display: none;
        }
    }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
    }

    .modal-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-bg-primary);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        max-width: 500px;
        width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        z-index: 1001;
        animation: modalSlideIn 0.3s ease-out;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-white);
    }

    .modal-close {
        background: none;
        border: none;
        color: var(--color-gray);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .modal-close:hover {
        color: var(--color-white);
        background: rgba(255, 255, 255, 0.1);
    }

    .modal-content {
        padding: 1.5rem;
    }

    .modal-description {
        color: var(--color-gray);
        margin-bottom: 2rem;
        text-align: center;
        font-size: 1rem;
    }

    .selections-container {
        margin-bottom: 2rem;
    }

    .template-selector {
        margin-bottom: 2rem;
    }

    .template-label {
        display: block;
        color: var(--color-white);
        font-weight: 500;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }

    .template-dropdown {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: var(--color-white);
        font-size: 1rem;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.7rem center;
        background-size: 1rem;
        padding-right: 2.5rem;
    }

    .template-dropdown:focus {
        border-color: var(--color-gold);
        outline: none;
        box-shadow: 0 0 0 3px rgba(250, 194, 17, 0.1);
    }

    .template-dropdown option {
        background: var(--color-bg-primary);
        color: var(--color-white);
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    .cancel-btn,
    .confirm-btn,
    .retry-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-white);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .confirm-btn {
        background: var(--color-gold);
        color: var(--color-black);
    }

    .confirm-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
    }

    .confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .retry-btn {
        background: var(--color-gold);
        color: var(--color-black);
        margin: 1rem auto 0;
        display: block;
    }

    .retry-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
    }

    .loading-error {
        text-align: center;
        padding: 2rem;
    }

    .error-message {
        color: #f87171;
        margin-bottom: 1rem;
        font-size: 1rem;
    }

    .type-selector {
        margin-bottom: 1rem;
    }

    .type-label {
        display: block;
        color: var(--color-white);
        font-weight: 500;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }

    .diagram-type-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .diagram-type-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        position: relative;
    }

    .diagram-type-option:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--color-gold);
        transform: translateY(-2px);
    }

    .diagram-type-option.selected {
        background: rgba(250, 194, 17, 0.1);
        border-color: var(--color-gold);
        box-shadow: 0 0 0 2px rgba(250, 194, 17, 0.2);
    }

    .diagram-type-option.selected .option-icon {
        color: var(--color-gold);
    }

    .option-icon {
        margin-bottom: 1rem;
        color: var(--color-gray);
        transition: color 0.2s;
    }

    .diagram-type-option.selected .option-icon {
        color: var(--color-gold);
    }

    .diagram-type-option h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-white);
    }

    .diagram-type-option p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--color-gray);
        line-height: 1.4;
    }


    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -40%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }

    @media (max-width: 640px) {
        .modal-dialog {
            width: 95vw;
            margin: 1rem;
        }

        .modal-header {
            padding: 1rem;
        }

        .modal-content {
            padding: 1rem;
        }


        .modal-actions {
            flex-direction: column;
        }

        .cancel-btn,
        .confirm-btn {
            width: 100%;
        }

        .diagram-type-options {
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        .diagram-type-option {
            padding: 1.5rem 1rem;
        }
    }
</style>