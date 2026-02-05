<script lang="ts">
	import type { WearcoTemplate } from "$lib/types/template";

	let {
		template,
		index,
		selectedTemplateId,
		onSelect,
	} = $props<{
		template: WearcoTemplate;
		index: number;
		selectedTemplateId: string | null;
		onSelect: (id: string) => void;
	}>();

	function getTemplateIcon(template: WearcoTemplate): string {
		return template.image_display || "📐";
	}

	function isImageSrc(value: string | null): value is string {
		return (
			value !== null &&
			(value.startsWith("http://") ||
				value.startsWith("https://") ||
				value.startsWith("data:") ||
				value.startsWith("/"))
		);
	}

	function getTemplateGradient(category: string | null): string {
		const gradients: Record<string, string> = {
			Edge: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
			Center: "linear-gradient(135deg, #2a2a2a 0%, #444 100%)",
			Perforation: "linear-gradient(135deg, #252525 0%, #404040 100%)",
			Custom: "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)",
		};
		return (
			gradients[category || ""] ||
			"linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)"
		);
	}
</script>

<button
	class="drawing-type-card"
	class:selected={selectedTemplateId === template.id}
	onclick={() => onSelect(template.id)}
	style="--animation-delay: {index * 0.1}s"
>
	<div
		class="type-icon-wrapper"
		style="background: {getTemplateGradient(template.category)}"
	>
		{#if template.image_display && isImageSrc(template.image_display)}
			<img src={template.image_display} alt="" class="type-icon-img" />
		{:else}
			<span class="type-icon">{getTemplateIcon(template)}</span>
		{/if}
	</div>
	<div class="type-info">
		<h3 class="type-name">{template.template_name}</h3>
		<p class="type-description">
			{template.description || "No description available"}
		</p>
	</div>
	<div class="type-check">
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	</div>
</button>

<style>
	.drawing-type-card {
		display: flex;
		flex-direction: column;
		padding: 0;
		background: rgba(30, 30, 30, 0.6);
		border: 2px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-2xl);
		cursor: pointer;
		transition: var(--transition-bounce);
		position: relative;
		overflow: hidden;
		animation: typeCardFadeIn 0.5s ease-out backwards;
		animation-delay: var(--animation-delay);
		text-align: center;
	}

	.drawing-type-card::before {
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at 50% 0%,
			rgba(250, 194, 17, 0.1) 0%,
			transparent 70%
		);
		opacity: 0;
		transition: var(--transition-normal);
	}

	.drawing-type-card:hover {
		border-color: rgba(250, 194, 17, 0.4);
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.drawing-type-card:hover::before {
		opacity: 1;
	}

	.drawing-type-card.selected {
		border-color: var(--color-gold);
		background: rgba(250, 194, 17, 0.08);
		box-shadow:
			0 0 0 1px var(--color-gold),
			0 12px 30px rgba(250, 194, 17, 0.15);
	}

	.type-icon-wrapper {
		width: 100%;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14px 14px 0 0;
		transition: var(--transition-normal);
		overflow: hidden;
	}

	.drawing-type-card:hover .type-icon-wrapper {
		transform: scale(1.02);
	}

	.type-icon {
		font-size: 4rem;
	}

	.type-icon-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.type-info {
		position: relative;
		z-index: 1;
		padding: 1.25rem;
		text-align: left;
		background: rgba(20, 20, 20, 0.6);
	}

	.type-name {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-white);
	}

	.type-description {
		font-size: var(--font-size-sm);
		color: var(--color-gray);
		margin: 0;
		line-height: 1.5;
	}

	.type-check {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-gold);
		border-radius: var(--radius-full);
		color: var(--color-black);
		opacity: 0;
		transform: scale(0);
		transition: var(--transition-bounce);
	}

	.drawing-type-card.selected .type-check {
		opacity: 1;
		transform: scale(1);
	}
</style>
