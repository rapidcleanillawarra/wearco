<script lang="ts">
	let {
		drawingTitle = "",
		deleting = false,
		onClose,
		onConfirm,
	} = $props<{
		drawingTitle: string;
		deleting?: boolean;
		onClose: () => void;
		onConfirm: () => void;
	}>();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="modal-overlay"
	role="dialog"
	aria-modal="true"
	aria-labelledby="delete-modal-title"
	tabindex="-1"
	onclick={onClose}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-container delete-modal" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2 id="delete-modal-title" class="title-gradient-sm">Delete drawing?</h2>
			<p class="modal-subtitle">
				This will remove "<strong>{drawingTitle}</strong>" from the list. You can restore it from the database if needed.
			</p>
			<button class="modal-close" onclick={onClose} aria-label="Close modal" disabled={deleting}>
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

		<div class="modal-footer">
			<button
				class="btn-secondary cancel-btn"
				onclick={onClose}
				disabled={deleting}
			>
				Cancel
			</button>
			<button
				class="btn-danger confirm-delete-btn"
				onclick={onConfirm}
				disabled={deleting}
				aria-busy={deleting}
			>
				{#if deleting}
					<span class="btn-loader" aria-hidden="true"></span>
					<span>Deleting…</span>
				{:else}
					<span>Delete</span>
					<svg
						width="18"
						height="18"
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
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--spacing-lg);
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-container {
		background: var(--gradient-card);
		border: var(--border-subtle);
		border-radius: var(--radius-2xl);
		max-width: 420px;
		width: 100%;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.25s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		position: relative;
		padding: var(--spacing-xl);
		padding-right: 3rem;
	}

	.modal-header .title-gradient-sm {
		font-size: var(--font-size-xl);
		margin: 0 0 var(--spacing-sm) 0;
	}

	.modal-subtitle {
		color: var(--color-gray);
		font-size: var(--font-size-sm);
		line-height: 1.5;
		margin: 0;
	}

	.modal-subtitle strong {
		color: var(--color-white);
	}

	.modal-close {
		position: absolute;
		top: var(--spacing-lg);
		right: var(--spacing-lg);
		background: transparent;
		border: none;
		color: var(--color-gray);
		cursor: pointer;
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
		transition: var(--transition-normal);
	}

	.modal-close:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-white);
	}

	.modal-close:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.modal-footer {
		display: flex;
		gap: var(--spacing-md);
		justify-content: flex-end;
		padding: var(--spacing-md) var(--spacing-xl) var(--spacing-xl);
		border-top: var(--border-subtle);
	}

	.btn-secondary {
		padding: 0.6rem 1.25rem;
		background: rgba(255, 255, 255, 0.08);
		border: var(--border-light);
		border-radius: var(--radius-lg);
		color: var(--color-gray);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-normal);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: var(--color-white);
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-danger {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0.6rem 1.25rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		color: var(--color-error);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-normal);
	}

	.btn-danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.3);
	}

	.btn-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-loader {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
