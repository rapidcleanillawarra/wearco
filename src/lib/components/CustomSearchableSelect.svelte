<script lang="ts">
    /**
     * CustomSearchableSelect: A searchable dropdown that allows selecting from predefined options
     * OR entering a custom value.
     */
    let {
        value = $bindable(""),
        options = [],
        placeholder = "Search or type...",
        class: className = "",
        onselect,
    } = $props<{
        value: string;
        options: { id: string; label: string }[];
        placeholder?: string;
        class?: string;
        onselect?: (val: string) => void;
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

    // Current displayed label
    let selectedLabel = $derived(
        options.find((opt: { id: string; label: string }) => opt.id === value)
            ?.label ||
            value ||
            "",
    );

    // If search term is not empty and not an exact match for any option, show "Use custom"
    let showCustomOption = $derived(
        searchTerm.trim() !== "" &&
            !options.some(
                (opt: { id: string; label: string }) =>
                    opt.id.toLowerCase() === searchTerm.toLowerCase() ||
                    opt.label.toLowerCase() === searchTerm.toLowerCase(),
            ),
    );

    function handleSelect(id: string) {
        value = id;
        searchTerm = "";
        isOpen = false;
        if (onselect) onselect(id);
    }

    function handleCustomSelect() {
        const customVal = searchTerm.trim();
        if (customVal) {
            handleSelect(customVal);
        }
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

<div class="custom-searchable-select {className}" bind:this={container}>
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
                        onkeydown={(e) => {
                            if (e.key === "Escape") isOpen = false;
                            if (e.key === "Enter" && showCustomOption) {
                                handleCustomSelect();
                            }
                        }}
                    />
                </div>

                <ul class="options-list" role="listbox">
                    {#if showCustomOption}
                        <li
                            class="option-item custom-option"
                            onclick={handleCustomSelect}
                            onkeydown={(e) =>
                                (e.key === "Enter" || e.key === " ") &&
                                handleCustomSelect()}
                            role="option"
                            aria-selected="false"
                            tabindex="0"
                        >
                            <span class="option-label">Use "{searchTerm}"</span>
                            <span class="option-hint">(Custom value)</span>
                        </li>
                    {/if}

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

                    {#if filteredOptions.length === 0 && !showCustomOption}
                        <li class="no-options">No matches found</li>
                    {/if}
                </ul>
            </div>
        {/if}
    </div>
</div>

<style>
    .custom-searchable-select {
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
        padding: 0.5rem 0.75rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        color: white;
        cursor: pointer;
        min-height: 38px;
        transition: border-color 0.2s;
    }

    .select-trigger:hover {
        border-color: #475569;
    }

    .selected-value {
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .selected-value.placeholder {
        color: #64748b;
    }

    .chevron {
        display: flex;
        align-items: center;
        color: #64748b;
    }

    .dropdown-panel {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        z-index: 50;
        overflow: hidden;
    }

    .search-container {
        position: relative;
        padding: 8px;
        border-bottom: 1px solid #334155;
    }

    .search-icon {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 8px 12px 8px 32px;
        background: #1e293b;
        border: 1px solid transparent;
        border-radius: 0.25rem;
        color: white;
        font-size: 0.875rem;
        outline: none;
        box-sizing: border-box;
    }

    .search-input:focus {
        border-color: #3b82f6;
    }

    .options-list {
        margin: 0;
        padding: 4px;
        list-style: none;
        max-height: 240px;
        overflow-y: auto;
    }

    .option-item {
        padding: 8px 12px;
        border-radius: 0.25rem;
        color: #f8fafc;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s;
        outline: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .option-item:hover,
    .option-item:focus {
        background: #1e293b;
    }

    .option-item.active {
        background: #3b82f6;
    }

    .custom-option {
        border-bottom: 1px solid #334155;
        margin-bottom: 4px;
        border-radius: 0;
    }

    .option-hint {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .no-options {
        padding: 12px;
        text-align: center;
        color: #64748b;
        font-size: 0.875rem;
        font-style: italic;
    }

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
</style>
