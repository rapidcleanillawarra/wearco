<script lang="ts">
	import type { WearcoDrawing, WearcoTemplate } from "$lib/types/template";
	import type { DrawingView } from "./types";
	import DrawingCard from "./components/DrawingCard.svelte";
	import DrawingRow from "./components/DrawingRow.svelte";
	import DrawingsHeader from "./components/DrawingsHeader.svelte";
	import DrawingsModal from "./components/DrawingsModal.svelte";

	let { data } = $props<{
		data: {
			drawings?: WearcoDrawing[];
			templates?: WearcoTemplate[];
			error?: string;
		};
	}>();

	const drawings = $derived(data?.drawings ?? []);
	const templates = $derived(data?.templates ?? []);
	const loadError = $derived(data?.error);

	let viewMode: "card" | "list" = $state("card");

	let showModal = $state(false);
	let selectedTemplateId: string | null = $state(null);

	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) {
			return "Invalid Date";
		}
		return dateFormatter.format(date);
	}

	function formatDrawing(drawing: WearcoDrawing): DrawingView {
		return {
			id: drawing.id,
			title:
				drawing.name ||
				drawing.drawing_number ||
				`Drawing ${drawing.id.slice(0, 8)}`,
			jobNumber: drawing.job_number || drawing.work_order || "No Job #",
			customer: drawing.customer || "No Customer",
			material: drawing.material || "No Material",
			thickness: drawing.thk || "No Thickness",
			updatedLabel: formatDate(drawing.updated_at),
			quantity: drawing.quantity || 1,
		};
	}

	const drawingItems = $derived(
		drawings.map((drawing: WearcoDrawing) => formatDrawing(drawing)),
	);

	function openModal() {
		showModal = true;
		selectedTemplateId = null;
	}

	function closeModal() {
		showModal = false;
		selectedTemplateId = null;
	}

	function selectTemplate(templateId: string) {
		selectedTemplateId = templateId;
	}

	function createDrawing() {
		if (selectedTemplateId) {
			window.location.href = `/drawings/draw?template_id=${selectedTemplateId}`;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && showModal) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="page-container-dark drawings-page">
	<DrawingsHeader bind:viewMode onOpenModal={openModal} />

	<main class="templates-main">
		{#if loadError}
			<div class="error-state">
				<span class="error-icon">⚠️</span>
				<p>Error loading drawings: {loadError}</p>
			</div>
		{:else}
			{#if viewMode === "card"}
				<div class="cards-grid">
					{#each drawingItems as drawing, index}
						<DrawingCard {drawing} {index} />
					{/each}
				</div>
			{:else}
				<div class="list-container">
					<div class="list-header">
						<span class="list-col name-col">Drawing</span>
						<span class="list-col code-col">Job/Work Order</span>
						<span class="list-col customer-col">Customer</span>
						<span class="list-col category-col">Material</span>
						<span class="list-col dimensions-col">Thickness</span>
						<span class="list-col date-col">Last Updated</span>
						<span class="list-col actions-col">Actions</span>
					</div>
					{#each drawingItems as drawing, index}
						<DrawingRow {drawing} {index} />
					{/each}
				</div>
			{/if}

			{#if drawingItems.length === 0}
				<div class="empty-state">
					<h3>No drawings yet</h3>
					<p>Create your first drawing to get started</p>
				</div>
			{/if}
		{/if}
	</main>
</div>

{#if showModal}
	<DrawingsModal
		{templates}
		{selectedTemplateId}
		onClose={closeModal}
		onSelectTemplate={selectTemplate}
		onCreate={createDrawing}
	/>
{/if}

<style>
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--spacing-lg);
	}

	.list-container {
		background: rgba(20, 20, 20, 0.6);
		border: var(--border-subtle);
		border-radius: var(--radius-2xl);
		overflow: hidden;
	}

	.list-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background: rgba(0, 0, 0, 0.3);
		border-bottom: var(--border-subtle);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-gray);
	}

	.list-col {
		font-size: 0.9rem;
	}

	.name-col {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.code-col {
		font-family: var(--font-mono);
		color: var(--color-gold);
		font-size: var(--font-size-sm);
	}

	.actions-col {
		display: flex;
		gap: var(--spacing-sm);
	}

	.error-icon {
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		.drawings-page {
			padding: var(--spacing-md);
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.list-header {
			display: none;
		}
	}
</style>
