<script lang="ts">
	import type { WearcoTemplate } from "$lib/types/template";
	import TemplateCard from "./TemplateCard.svelte";

	let {
		templates = [],
		selectedTemplateId,
		onClose,
		onSelectTemplate,
		onCreate,
	} = $props<{
		templates: WearcoTemplate[];
		selectedTemplateId: string | null;
		onClose: () => void;
		onSelectTemplate: (id: string) => void;
		onCreate: () => void;
	}>();
</script>

<div class="modal-overlay" onclick={onClose} role="dialog" aria-modal="true">
	<div class="modal-container" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2 class="title-gradient-sm">Create New Drawing</h2>
			<p class="modal-subtitle">Select a drawing type to begin</p>
			<button class="modal-close" onclick={onClose} aria-label="Close modal">
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

		<div class="modal-body">
			{#if templates.length === 0}
				<div class="empty-templates">
					<span class="empty-icon">📋</span>
					<p>No templates available. Please add templates in the database.</p>
				</div>
			{:else}
				<div class="drawing-types-grid">
					{#each templates as template, index}
						<TemplateCard
							{template}
							{index}
							{selectedTemplateId}
							onSelect={onSelectTemplate}
						/>
					{/each}
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="btn-secondary cancel-btn" onclick={onClose}>
				Cancel
			</button>
			<button
				class="btn-primary create-btn"
				onclick={onCreate}
				disabled={!selectedTemplateId}
			>
				<span>Create Drawing</span>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<line x1="5" y1="12" x2="19" y2="12" />
					<polyline points="12 5 19 12 12 19" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.modal-subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: var(--font-size-base);
	}

	.empty-templates {
		text-align: center;
		padding: var(--spacing-2xl) var(--spacing-xl);
		color: var(--color-gray);
	}

	.empty-templates .empty-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: var(--spacing-md);
		opacity: 0.5;
	}

	.drawing-types-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.cancel-btn {
		padding: 0.75rem var(--spacing-lg);
		border-radius: var(--radius-lg);
	}

	.create-btn {
		gap: var(--spacing-sm);
		padding: 0.75rem 1.75rem;
	}

	.create-btn svg {
		transition: var(--transition-normal);
	}

	.create-btn:hover:not(:disabled) svg {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.drawing-types-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
