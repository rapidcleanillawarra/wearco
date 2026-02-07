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

<div class="list-row" style="--animation-delay: {index * 0.05}s">
    <span class="list-col name-col">
        <span class="row-icon">📊</span>
        <span class="row-name">{diagram.name}</span>
    </span>
    <span class="list-col template-col">
        {#if diagram.wearco_templates?.template_name}
            <span class="template-badge">{diagram.wearco_templates.template_name}</span>
        {:else}
            <span class="no-template">-</span>
        {/if}
    </span>
    <span class="list-col created-col">{formattedDate}</span>
    <span class="list-col updated-col">{formattedDate}</span>
    <span class="list-col actions-col">
        <button class="row-action" onclick={onEdit} aria-label="Edit diagram">
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
        >
            <input type="hidden" name="id" value={diagram.id} />
            <button
                class="row-action delete"
                aria-label="Delete diagram"
                disabled={isDeleting}
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
            </button>
        </form>
    </span>
</div>

<style>
    .list-row {
        display: grid;
        grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
        gap: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: var(--transition-normal);
        animation: rowSlideIn 0.4s ease-out backwards;
        animation-delay: var(--animation-delay);
    }

    .list-row:last-child {
        border-bottom: none;
    }

    .list-row:hover {
        background: rgba(250, 194, 17, 0.05);
    }

    .list-col {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .name-col {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .row-icon {
        font-size: 1.5rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .row-name {
        font-weight: var(--font-weight-medium);
        color: var(--color-white);
    }

    .template-col {
        color: var(--color-gray);
    }

    .template-badge {
        display: inline-block;
        padding: 4px 10px;
        background: rgba(250, 194, 17, 0.15);
        color: var(--color-gold);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        border-radius: var(--radius-sm);
    }

    .no-template {
        color: var(--color-gray);
        font-style: italic;
    }

    .created-col, .updated-col {
        color: var(--color-gray);
    }

    .actions-col {
        display: flex;
        gap: var(--spacing-sm);
    }

    .row-action {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.05);
        border: var(--border-light);
        border-radius: var(--radius-md);
        color: var(--color-gray);
        cursor: pointer;
        transition: var(--transition-normal);
    }

    .row-action:hover {
        background: rgba(250, 194, 17, 0.2);
        border-color: var(--color-gold);
        color: var(--color-gold);
    }

    .row-action.delete:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: var(--color-error);
        color: var(--color-error);
    }

    .row-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .list-row {
            grid-template-columns: 1fr;
            gap: var(--spacing-sm);
            padding: var(--spacing-md);
        }

        .list-col {
            display: flex;
            justify-content: space-between;
            padding: var(--spacing-xs) 0;
            white-space: normal;
        }

        .list-col::before {
            content: attr(data-label);
            font-weight: var(--font-weight-semibold);
            color: var(--color-gray);
            font-size: var(--font-size-xs);
            text-transform: uppercase;
        }

        .name-col::before {
            content: "Name";
        }

        .template-col::before {
            content: "Template";
        }

        .created-col::before {
            content: "Created";
        }

        .updated-col::before {
            content: "Updated";
        }

        .actions-col::before {
            content: "Actions";
        }
    }
</style>