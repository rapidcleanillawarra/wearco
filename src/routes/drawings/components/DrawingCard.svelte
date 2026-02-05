<script lang="ts">
	import type { DrawingView } from "../types";

	let { drawing, index } = $props<{
		drawing: DrawingView;
		index: number;
	}>();
</script>

<article class="template-card" style="--animation-delay: {index * 0.1}s">
	<div class="card-thumbnail">
		<span class="thumbnail-icon">📐</span>
		<div class="card-badge">{drawing.quantity} pcs</div>
	</div>
	<div class="card-content">
		<h3 class="card-title">{drawing.title}</h3>
		<p class="card-code">{drawing.jobNumber}</p>
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
					<path
						d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
					/>
					<circle cx="12" cy="7" r="4" />
				</svg>
				{drawing.customer}
			</span>
			<span class="meta-item">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect
						x="3"
						y="4"
						width="18"
						height="18"
						rx="2"
						ry="2"
					/>
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
				{drawing.updatedLabel}
			</span>
		</div>
		<div class="card-dimensions">
			<span class="dimension">{drawing.material}</span>
			<span class="separator">&bull;</span>
			<span class="holes">{drawing.thickness}</span>
		</div>
	</div>
	<div class="card-actions">
		<a href="/drawings/edit/{drawing.id}" class="action-btn edit-btn">
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
		</a>
		<button class="action-btn duplicate-btn">
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
			Duplicate
		</button>
	</div>
</article>

<style>
	.template-card {
		background: var(--gradient-card);
		border: var(--border-subtle);
		border-radius: var(--radius-2xl);
		overflow: hidden;
		transition: var(--transition-bounce);
		animation: cardFadeIn 0.6s ease-out backwards;
		animation-delay: var(--animation-delay);
	}

	.template-card:hover {
		transform: translateY(-6px);
		border-color: rgba(250, 194, 17, 0.3);
		box-shadow:
			var(--shadow-xl),
			0 0 60px rgba(250, 194, 17, 0.1);
	}

	.card-thumbnail {
		height: 120px;
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
	}

	.thumbnail-icon {
		font-size: 3rem;
		filter: grayscale(20%);
		transition: var(--transition-normal);
	}

	.template-card:hover .thumbnail-icon {
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
	}

	.card-content {
		padding: 1.25rem;
	}

	.card-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		margin: 0 0 var(--spacing-xs) 0;
		color: var(--color-white);
	}

	.card-code {
		color: var(--color-gold);
		font-size: var(--font-size-sm);
		margin: 0 0 0.75rem 0;
		font-family: var(--font-mono);
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		margin-bottom: 0.75rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: var(--color-gray);
	}

	.card-dimensions {
		font-size: 0.8rem;
		color: var(--color-gray);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.separator {
		color: rgba(255, 255, 255, 0.2);
	}

	.card-actions {
		display: flex;
		border-top: var(--border-subtle);
	}

	.action-btn {
		flex: 1;
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
		text-decoration: none;
	}

	.action-btn:first-child {
		border-right: var(--border-subtle);
	}

	.action-btn:hover {
		background: rgba(250, 194, 17, 0.1);
		color: var(--color-gold);
	}
</style>
