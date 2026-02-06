<script lang="ts">
    import type { WearcoTemplate } from "$lib/types/template";
    import TemplateCard from "./components/TemplateCard.svelte";
    import TemplateRow from "./components/TemplateRow.svelte";
    import TemplateModal from "./components/TemplateModal.svelte";
    import { fade } from "svelte/transition";

    let { data, form } = $props<{
        data: {
            templates: WearcoTemplate[];
            error?: string;
        };
        form?: {
            success?: boolean;
            message?: string;
        };
    }>();

    const templates = $derived(data.templates ?? []);
    const loadError = $derived(data.error);

    let viewMode: "card" | "list" = $state("card");
    let searchQuery = $state("");
    let selectedCategory = $state("all");

    let showModal = $state(false);
    let selectedTemplate: WearcoTemplate | null = $state(null);

    // Derived state for filtering
    const uniqueCategories = $derived([
        "all",
        ...new Set(templates.map((t) => t.category).filter(Boolean)),
    ]);

    const filteredTemplates = $derived(
        templates.filter((t) => {
            const matchesSearch =
                t.template_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (t.description?.toLowerCase() || "").includes(
                    searchQuery.toLowerCase(),
                );
            const matchesCategory =
                selectedCategory === "all" || t.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }),
    );

    function openCreateModal() {
        selectedTemplate = null;
        showModal = true;
    }

    function openEditModal(template: WearcoTemplate) {
        selectedTemplate = template;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        selectedTemplate = null;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && showModal) {
            closeModal();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="page-container-dark templates-page">
    <!-- Header Section -->
    <header class="page-header">
        <div class="header-content">
            <div class="title-section">
                <h1>Templates</h1>
                <p class="subtitle">Manage your drawing templates</p>
            </div>

            <div class="header-actions">
                <button class="create-btn" onclick={openCreateModal}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Template
                </button>
            </div>
        </div>

        <!-- Controls Bar -->
        <div class="controls-bar">
            <div class="search-filters">
                <div class="search-box">
                    <svg
                        class="search-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search templates..."
                        bind:value={searchQuery}
                    />
                </div>

                <div class="category-filter">
                    <select bind:value={selectedCategory}>
                        {#each uniqueCategories as category}
                            <option value={category}
                                >{category === "all"
                                    ? "All Categories"
                                    : category}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>

            <div class="view-toggles">
                <button
                    class="toggle-btn {viewMode === 'card' ? 'active' : ''}"
                    onclick={() => (viewMode = "card")}
                    aria-label="Grid view"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                </button>
                <button
                    class="toggle-btn {viewMode === 'list' ? 'active' : ''}"
                    onclick={() => (viewMode = "list")}
                    aria-label="List view"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <main class="templates-main">
        {#if form?.message}
            <div
                class="alert {form.success ? 'success' : 'error'}"
                transition:fade
            >
                {form.message}
            </div>
        {/if}

        {#if loadError}
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <p>Error loading templates: {loadError}</p>
            </div>
        {:else if filteredTemplates.length === 0}
            <div class="empty-state">
                <h3>No templates found</h3>
                <p>
                    {searchQuery
                        ? "Try adjusting your search or filters"
                        : "Create your first template to get started"}
                </p>
            </div>
        {:else if viewMode === "card"}
            <div class="cards-grid">
                {#each filteredTemplates as template, index (template.id)}
                    <TemplateCard
                        {template}
                        {index}
                        onEdit={() => openEditModal(template)}
                    />
                {/each}
            </div>
        {:else}
            <div class="list-container">
                <div class="list-header">
                    <span class="list-col name-col">Template</span>
                    <span class="list-col category-col">Category</span>
                    <span class="list-col desc-col">Description</span>
                    <span class="list-col date-col">Last Updated</span>
                    <span class="list-col actions-col">Actions</span>
                </div>
                {#each filteredTemplates as template, index (template.id)}
                    <TemplateRow
                        {template}
                        {index}
                        onEdit={() => openEditModal(template)}
                    />
                {/each}
            </div>
        {/if}
    </main>
</div>

{#if showModal}
    <TemplateModal template={selectedTemplate} onClose={closeModal} />
{/if}

<style>
    /* Reuse global styles and specific page styles similar to Drawings page */
    .templates-page {
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

    .category-filter select {
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
        .templates-page {
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

        .category-filter select {
            width: 100%;
        }

        .list-header {
            display: none;
        }
    }
</style>
