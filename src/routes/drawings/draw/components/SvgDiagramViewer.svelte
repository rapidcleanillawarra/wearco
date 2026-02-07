<script lang="ts">
    let { url, name } = $props<{
        url?: string;
        name: string;
    }>();

    let loading = $state(true);
    let error = $state(false);

    function handleLoad() {
        loading = false;
    }

    function handleError() {
        loading = false;
        error = true;
    }
</script>

<div class="svg-viewer">
    {#if url}
        {#if loading}
            <div class="viewer-status loading">
                <span class="spinner"></span>
                <span>Loading diagram...</span>
            </div>
        {/if}

        {#if error}
            <div class="viewer-status error">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Failed to load diagram</span>
            </div>
        {/if}

        <img
            src={url}
            alt={name}
            class="diagram-svg"
            class:hidden={loading || error}
            onload={handleLoad}
            onerror={handleError}
        />
    {:else}
        <div class="viewer-status empty">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>No SVG file associated</span>
        </div>
    {/if}
</div>

<style>
    .svg-viewer {
        width: 100%;
        height: 100%;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-md);
        overflow: hidden;
        position: relative;
    }

    .diagram-svg {
        width: 100%;
        height: auto;
        max-height: 100%;
        object-fit: contain;
        display: block;
        padding: var(--spacing-md);
    }

    .diagram-svg.hidden {
        display: none;
    }

    .viewer-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--color-gray);
        font-size: var(--font-size-sm);
    }

    .viewer-status.error {
        color: #ef4444;
    }

    .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top: 3px solid var(--color-gold);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
