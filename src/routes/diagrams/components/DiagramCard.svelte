<script lang="ts">
    import type { WearcoSvgDiagram } from "$lib/types/svg_diagram";
    import { enhance } from "$app/forms";

    let { diagram, index, onEdit } = $props<{
        diagram: WearcoSvgDiagram & {
            wearco_templates?: {
                template_name: string;
                category: string;
            };
        };
        index: number;
        onEdit: () => void;
    }>();

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(diagram.updated_at));

    let isDeleting = $state(false);
</script>

<article class="diagram-card" style="--animation-delay: {index * 0.1}s">
    <div class="card-thumbnail">
        <span class="thumbnail-icon">📊</span>
        {#if diagram.wearco_templates?.category}
            <div class="card-badge">{diagram.wearco_templates.category}</div>
        {/if}
    </div>
    <div class="card-content">
        <h3 class="card-title">{diagram.name}</h3>
        <p class="card-description">
            {diagram.wearco_templates?.template_name || "No template associated"}
        </p>
        <div class="card-meta">
            <span class="meta-item">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formattedDate}
            </span>
            {#if diagram.data && Object.keys(diagram.data).length > 0}
                <span class="meta-item">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    {Object.keys(diagram.data).length} properties
                </span>
            {/if}
        </div>
    </div>
    <div class="card-actions">
        <button
            class="action-btn edit-btn"
            onclick={onEdit}
            aria-label="Edit diagram"
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                />
                <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                />
            </svg>
            Edit
        </button>

        <form
            method="POST"
            action="?/deleteDiagram"
            use:enhance={() => {
                isDeleting = true;
                return async ({ update }) => {
                    await update();
                    isDeleting = false;
                };
            }}
            class="delete-form"
        >
            <input type="hidden" name="id" value={diagram.id} />
            <button
                class="action-btn delete-btn"
                disabled={isDeleting}
                aria-label="Delete diagram"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <polyline points="3 6 5 6 21 6" />
                    <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                </svg>
                Delete
            </button>
        </form>
    </div>
</article>

<style>
    .diagram-card {
        background: var(--gradient-card);
        border: var(--border-subtle);
        border-radius: var(--radius-2xl);
        overflow: hidden;
        transition: var(--transition-bounce);
        animation: cardFadeIn 0.6s ease-out backwards;
        animation-delay: var(--animation-delay);
        display: flex;
        flex-direction: column;
    }

    .diagram-card:hover {
        transform: translateY(-6px);
        border-color: rgba(250, 194, 17, 0.3);
        box-shadow:
            var(--shadow-xl),
            0 0 60px rgba(250, 194, 17, 0.1);
    }

    .card-thumbnail {
        height: 140px;
        background: linear-gradient(
            135deg,
            var(--color-dark-gray) 0%,
            #2a2a2a 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }

    .card-thumbnail::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
                circle at 20% 80%,
                rgba(250, 194, 17, 0.1) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 80% 20%,
                rgba(250, 194, 17, 0.05) 0%,
                transparent 40%
            );
        z-index: 1;
    }

    .thumbnail-icon {
        font-size: 3rem;
        filter: grayscale(20%);
        transition: var(--transition-normal);
        z-index: 2;
    }

    .diagram-card:hover .thumbnail-icon {
        transform: scale(1.1);
        filter: grayscale(0%);
    }

    .card-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 10px;
        background: rgba(250, 194, 17, 0.9);
        color: var(--color-black);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        border-radius: var(--radius-sm);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        z-index: 2;
    }

    .card-content {
        padding: 1.25rem;
        flex: 1;
    }

    .card-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--color-white);
    }

    .card-description {
        color: var(--color-gray);
        font-size: 0.9rem;
        margin: 0 0 1rem 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md);
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--color-gray);
    }

    .card-actions {
        display: flex;
        border-top: var(--border-subtle);
    }

    .action-btn {
        flex: 1;
        width: 100%; /* For when inside form */
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: 0.9rem;
        background: transparent;
        border: none;
        color: var(--color-gray);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: var(--transition-normal);
    }

    .delete-form {
        flex: 1;
        display: flex;
    }

    .action-btn:first-child {
        border-right: var(--border-subtle);
    }

    .action-btn:hover:not(:disabled) {
        background: rgba(250, 194, 17, 0.1);
        color: var(--color-gold);
    }

    .delete-btn:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1) !important;
        color: var(--color-error) !important;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>