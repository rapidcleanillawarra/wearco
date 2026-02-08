<script lang="ts">
    let {
        value = $bindable(""),
        options = [],
        placeholder = "Search...",
        onselect,
        class: className = "",
    } = $props<{
        value: string;
        options: { id: string; label: string }[];
        placeholder?: string;
        onselect?: (val: string) => void;
        class?: string;
    }>();

    let searchTerm = $state("");
    let isOpen = $state(false);
    let container: HTMLDivElement = $state()!;
    let searchInput: HTMLInputElement = $state()!;

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

    function handleClickOutside(event: MouseEvent) {
        if (container && !container.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            setTimeout(() => searchInput?.focus(), 0);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }
        return () => document.removeEventListener("click", handleClickOutside);
    });
</script>

<div class="searchable-select {className}" bind:this={container}>
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
        >
            <span class="selected-value" class:placeholder={!selectedLabel}>
                {selectedLabel || placeholder}
            </span>
            <span class="chevron" aria-hidden="true">
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </span>
        </div>

        {#if isOpen}
            <div class="dropdown-panel">
                <div class="search-container">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="search-icon"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        bind:this={searchInput}
                        type="text"
                        class="search-input"
                        bind:value={searchTerm}
                        {placeholder}
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) =>
                            e.key === "Escape" && (isOpen = false)}
                    />
                </div>

                <ul class="options-list" role="listbox">
                    {#if filteredOptions.length === 0}
                        <li class="no-options">No matches found</li>
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
                            </li>
                        {/each}
                    {/if}
                </ul>
            </div>
        {/if}
    </div>
</div>

<style>
    .searchable-select {
        position: relative;
        width: 100%;
    }

    .select-wrapper {
        position: relative;
    }

    .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: var(--border-light);
        border-radius: var(--radius-lg);
        color: var(--color-white);
        cursor: pointer;
        min-height: 42px;
        transition: var(--transition-smooth);
    }

    .select-trigger:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .select-trigger[aria-expanded="true"] {
        border-color: var(--color-gold);
        box-shadow: 0 0 0 3px rgba(250, 194, 17, 0.1);
    }

    .selected-value {
        font-size: var(--font-size-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .selected-value.placeholder {
        color: var(--color-gray);
    }

    .chevron {
        display: flex;
        align-items: center;
        color: var(--color-gray);
        transition: var(--transition-normal);
    }

    .select-trigger[aria-expanded="true"] .chevron {
        transform: rotate(180deg);
        color: var(--color-gold);
    }

    .dropdown-panel {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: #1a1a1a;
        border: var(--border-light);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: var(--z-dropdown);
        overflow: hidden;
        animation: dropdownFadeIn 0.2s ease-out;
    }

    @keyframes dropdownFadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .search-container {
        position: relative;
        padding: 8px;
        border-bottom: var(--border-subtle);
    }

    .search-icon {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-gray);
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 8px 12px 8px 32px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        color: var(--color-white);
        font-size: var(--font-size-sm);
        outline: none;
        transition: var(--transition-smooth);
    }

    .search-input:focus {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--color-gold);
    }

    .options-list {
        margin: 0;
        padding: 4px;
        list-style: none;
        max-height: 240px;
        overflow-y: auto;
    }

    .option-item {
        padding: 10px 12px;
        border-radius: var(--radius-md);
        color: var(--color-gray);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: var(--transition-fast);
        outline: none;
    }

    .option-item:hover,
    .option-item:focus {
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-white);
    }

    .option-item.active {
        background: rgba(250, 194, 17, 0.15);
        color: var(--color-gold);
        font-weight: var(--font-weight-medium);
    }

    .no-options {
        padding: 16px;
        text-align: center;
        color: var(--color-gray);
        font-size: var(--font-size-sm);
        font-style: italic;
    }

    /* Scrollbar styling */
    .options-list::-webkit-scrollbar {
        width: 4px;
    }

    .options-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .options-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
    }

    .options-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
