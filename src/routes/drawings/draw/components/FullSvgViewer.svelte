<script lang="ts">
    import type { WearcoDiagram } from "$lib/types/svg_diagram";

    let { diagram } = $props<{
        diagram: WearcoDiagram | null;
    }>();

    async function handleDownload() {
        if (!diagram?.signedUrl) return;

        try {
            const response = await fetch(diagram.signedUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${diagram.name.toLowerCase().replace(/\s+/g, "_")}.svg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download SVG.");
        }
    }
</script>

{#if diagram}
    <section class="full-svg-container">
        <div class="viewer-header">
            <div class="header-info">
                <h3>{diagram.name}</h3>
                <span class="badge">{diagram.type || "Diagram"}</span>
            </div>
            <div class="header-actions">
                <button class="btn-download" onclick={handleDownload}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download SVG
                </button>
            </div>
        </div>

        <div class="svg-stage">
            <div class="svg-canvas">
                <img src={diagram.signedUrl} alt={diagram.name} />
            </div>
        </div>
    </section>
{/if}

<style>
    .full-svg-container {
        background: var(--gradient-card);
        border: 2px solid var(--color-gold);
        border-radius: var(--radius-2xl);
        overflow: hidden;
        margin-bottom: var(--spacing-xl);
        animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .viewer-header {
        padding: var(--spacing-lg) var(--spacing-xl);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-info h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        color: var(--color-white);
    }

    .badge {
        font-size: 10px;
        background: rgba(var(--color-gold-rgb), 0.2);
        color: var(--color-gold);
        padding: 2px 8px;
        border-radius: var(--radius-full);
        text-transform: uppercase;
        font-weight: bold;
        margin-top: 4px;
        display: inline-block;
    }

    .header-actions {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
    }

    .btn-download {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--color-gold);
        color: var(--color-black);
        border: none;
        border-radius: var(--radius-lg);
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-download:hover {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(var(--color-gold-rgb), 0.4);
    }

    .svg-stage {
        padding: var(--spacing-xl);
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
    }

    .svg-canvas {
        background: white;
        width: 100%;
        max-width: 1200px;
        aspect-ratio: 16/9;
        padding: var(--spacing-2xl);
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .svg-canvas img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
</style>
