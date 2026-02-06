<script lang="ts">
	import type { DrawingView } from "../types";

	let { drawing, index } = $props<{
		drawing: DrawingView;
		index: number;
	}>();
</script>

<div class="list-row" style="--animation-delay: {index * 0.05}s">
	<span class="list-col name-col">
		<span class="row-icon">📐</span>
		<span class="row-name">{drawing.title}</span>
	</span>
	<span class="list-col code-col">{drawing.jobNumber}</span>
	<span class="list-col customer-col">{drawing.customer}</span>
	<span class="list-col category-col">
		<span class="category-badge">{drawing.material}</span>
	</span>
	<span class="list-col dimensions-col">{drawing.thickness}</span>
	<span class="list-col date-col">{drawing.updatedLabel}</span>
	<span class="list-col actions-col">
		<a href="/drawings/draw?id={drawing.id}" class="row-action">
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
		</a>
		<button class="row-action">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
				<path
					d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				/>
			</svg>
		</button>
		<button class="row-action delete">
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
	</span>
</div>

<style>
	.list-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
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
	}

	.name-col {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.row-icon {
		font-size: 1.5rem;
	}

	.row-name {
		font-weight: var(--font-weight-medium);
		color: var(--color-white);
	}

	.code-col {
		font-family: var(--font-mono);
		color: var(--color-gold);
		font-size: var(--font-size-sm);
	}

	.category-badge {
		display: inline-block;
		padding: 4px 10px;
		background: rgba(250, 194, 17, 0.15);
		color: var(--color-gold);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-sm);
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
		text-decoration: none;
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
		}

		.list-col::before {
			content: attr(data-label);
			font-weight: var(--font-weight-semibold);
			color: var(--color-gray);
			font-size: var(--font-size-xs);
			text-transform: uppercase;
		}
	}
</style>
