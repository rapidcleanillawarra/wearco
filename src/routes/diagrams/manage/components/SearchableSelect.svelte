<script lang="ts">
    let {
        value = $bindable(""),
        options = [],
        label = "",
        placeholder = "Search...",
        onselect,
    } = $props<{
        value: string;
        options: { id: string; label: string }[];
        label?: string;
        placeholder?: string;
        onselect?: (val: string) => void;
    }>();

    let searchTerm = $state("");
    let isOpen = $state(false);
    let container: HTMLDivElement;
    let searchInput: HTMLInputElement;

    let filteredOptions = $derived(
        options.filter(
            (opt: { id: string; label: string }) =>
                opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                opt.id.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    let selectedLabel = $derived(
        options.find((opt: { id: string; label: string }) => opt.id === value)
            ?.label || "",
    );

    function handleSelect(id: string) {
        value = id;
        searchTerm = "";
        isOpen = false;
        if (onselect) onselect(id);
    }

    // Close on click outside
    function handleClickOutside(event: MouseEvent) {
        if (container && !container.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            // Focus search input when opened
            setTimeout(() => searchInput?.focus(), 0);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }
        return () => document.removeEventListener("click", handleClickOutside);
    });

    // Generate a unique ID for a11y
    const uniqueId = Math.random().toString(36).substring(2, 9);
</script>

<div class="searchable-select-container" bind:this={container}>
    {#if label}
        <span class="select-label" id={`label-${uniqueId}`}>{label}</span>
    {/if}

    <div class="select-wrapper">
        <div
            class="select-trigger"
            onclick={() => (isOpen = !isOpen)}
            role="button"
            tabindex="0"
            onkeydown={(e) =>
                (e.key === "Enter" || e.key === " ") && (isOpen = !isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `label-${uniqueId}` : undefined}
        >
            <span class="selected-value" class:placeholder={!selectedLabel}>
                {selectedLabel || placeholder}
            </span>
            <span class="chevron" aria-hidden="true">▼</span>
        </div>

        {#if isOpen}
            <div class="dropdown-panel">
                <input
                    bind:this={searchInput}
                    type="text"
                    class="search-input"
                    bind:value={searchTerm}
                    {placeholder}
                    onclick={(e) => e.stopPropagation()}
                    onkeydown={(e) => e.key === "Escape" && (isOpen = false)}
                    aria-label={`Search ${label || "options"}`}
                />

                <ul class="options-list" role="listbox">
                    {#if filteredOptions.length === 0}
                        <li
                            class="no-options"
                            role="option"
                            aria-disabled="true"
                        >
                            No matches found
                        </li>
                    {:else}
                        {#each filteredOptions as option}
                            <li
                                class="option-item"
                                class:active={value === option.id}
                                onclick={() => handleSelect(option.id)}
                                onkeydown={(e) =>
                                    (e.key === "Enter" || e.key === " ") &&
                                    handleSelect(option.id)}
                                role="option"
                                aria-selected={value === option.id}
                                tabindex="0"
                            >
                                <span class="option-label">{option.label}</span>
                                <span class="option-id">{option.id}</span>
                            </li>
                        {/each}
                    {/if}
                </ul>
            </div>
        {/if}
    </div>
</div>

<style>
    .searchable-select-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    .select-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #94a3b8;
        width: 140px;
        flex-shrink: 0;
        text-transform: capitalize;
    }

    .select-wrapper {
        position: relative;
        flex: 1;
    }

    .select-trigger {
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 38px;
        transition: border-color 0.2s;
    }

    .select-trigger:hover {
        border-color: #475569;
    }

    .selected-value {
        font-size: 0.9rem;
    }

    .selected-value.placeholder {
        color: #64748b;
    }

    .chevron {
        font-size: 0.7rem;
        color: #64748b;
    }

    .dropdown-panel {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        z-index: 50;
        display: flex;
        flex-direction: column;
        max-height: 300px;
    }

    .search-input {
        background: #1e293b;
        border: none;
        border-bottom: 1px solid #334155;
        color: white;
        padding: 0.75rem;
        width: 100%;
        outline: none;
        font-size: 0.9rem;
    }

    .options-list {
        list-style: none;
        padding: 4px 0;
        margin: 0;
        overflow-y: auto;
    }

    .option-item {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
        transition: background 0.2s;
        outline: none;
    }

    .option-item:hover,
    .option-item:focus {
        background: #1e293b;
    }

    .option-item.active {
        background: #3b82f6;
    }

    .option-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: white;
    }

    .option-id {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .option-item.active .option-id {
        color: rgba(255, 255, 255, 0.8);
    }

    .no-options {
        padding: 1rem;
        color: #64748b;
        font-size: 0.875rem;
        text-align: center;
    }
</style>
