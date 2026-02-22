<script lang="ts">
	import { enhance } from "$app/forms";
	import type { WearcoDrawing, WearcoTemplate } from "$lib/types/template";
	import type { DrawingView } from "./types";
	import DrawingCard from "./components/DrawingCard.svelte";
	import DrawingRow from "./components/DrawingRow.svelte";
	import DrawingsHeader from "./components/DrawingsHeader.svelte";
	import DrawingsModal from "./components/DrawingsModal.svelte";
	import DeleteConfirmModal from "./components/DeleteConfirmModal.svelte";

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
	let showDeleteModal = $state(false);
	let deleteDrawing: DrawingView | null = $state(null);
	let deleteFormEl: HTMLFormElement | undefined = $state(undefined);
	let deleting = $state(false);
	let selectedTemplateId: string | null = $state(null);
	let searchQuery = $state("");
	let selectedCustomer = $state("All Customers");
	let creating = $state(false);

	let toaster = $state<{
		show: boolean;
		type: "success" | "error";
		message: string;
	}>({ show: false, type: "success", message: "" });

	function showToaster(type: "success" | "error", message: string) {
		toaster = { show: true, type, message };
		setTimeout(() => {
			toaster = { ...toaster, show: false };
		}, 4000);
	}

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

	function formatDrawing(
		drawing: WearcoDrawing,
		templatesList: WearcoTemplate[],
	): DrawingView {
		const template = drawing.template_id
			? templatesList.find((t) => t.id === drawing.template_id)
			: null;
		return {
			id: drawing.id,
			title: drawing.job_number || "No Job #",
			workOrder:
				drawing.work_order ||
				drawing.customer_source ||
				"No Work Order",
			jobNumber: drawing.job_number || "No Job #",
			customer: drawing.customer || "No Customer",
			drawingNumber: drawing.drawing_number || "No Dwg #",
			progBy: drawing.prog_by || "---",
			checkedBy: drawing.checked_by || "---",
			updatedLabel: formatDate(drawing.updated_at),
			quantity: drawing.quantity || 1,
			imageDisplay: template?.image_display ?? null,
		};
	}

	const allCustomers = $derived([
		"All Customers",
		...new Set(
			drawings
				.map((d: WearcoDrawing) => d.customer)
				.filter((c: string | null): c is string => Boolean(c))
				.sort(),
		),
	] as string[]);

	const drawingItems = $derived(
		drawings
			.map((drawing: WearcoDrawing) => formatDrawing(drawing, templates))
			.filter((item: DrawingView) => {
				const matchesSearch =
					item.title
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.workOrder
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.customer
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.drawingNumber
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.progBy
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.checkedBy
						.toLowerCase()
						.includes(searchQuery.toLowerCase());

				const matchesCustomer =
					selectedCustomer === "All Customers" ||
					item.customer === selectedCustomer;

				return matchesSearch && matchesCustomer;
			}),
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
		if (selectedTemplateId && !creating) {
			creating = true;
			// Allow the loader to render before navigating
			requestAnimationFrame(() => {
				window.location.href = `/drawings/draw?template_id=${selectedTemplateId}`;
			});
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			if (showDeleteModal) closeDeleteModal();
			else if (showModal) closeModal();
		}
	}

	function openDeleteModal(drawing: DrawingView) {
		deleteDrawing = drawing;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		if (!deleting) {
			showDeleteModal = false;
			deleteDrawing = null;
		}
	}

	function handleDeleteResult(result: { type: string; data?: { success?: boolean; error?: string } }) {
		if (result?.type === "success" && result?.data?.success) {
			closeDeleteModal();
			deleteDrawing = null;
			showToaster("success", "Drawing has been successfully deleted.");
		} else if (result?.data?.error) {
			console.error("Delete failed:", result.data.error);
			showToaster("error", result.data.error);
		}
		deleting = false;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if toaster.show}
	<div class="toaster {toaster.type}">
		<span class="toaster-icon">
			{#if toaster.type === "success"}
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{:else}
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			{/if}
		</span>
		<span class="toaster-message">{toaster.message}</span>
		<button
			class="toaster-close"
			onclick={() => (toaster = { ...toaster, show: false })}
			aria-label="Close notification"
		>
			&times;
		</button>
	</div>
{/if}

<div class="page-container-dark drawings-page">
	<DrawingsHeader
		bind:viewMode
		bind:searchQuery
		bind:selectedCustomer
		customers={allCustomers}
		onOpenModal={openModal}
	/>

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
						<DrawingCard {drawing} {index} onDelete={() => openDeleteModal(drawing)} />
					{/each}
				</div>
			{:else}
				<div class="list-container">
					<div class="list-header">
						<span class="list-col name-col">Drawing</span>
						<span class="list-col dwg-col">Dwg #</span>
						<span class="list-col code-col">Job/Work Order</span>
						<span class="list-col customer-col">Customer</span>
						<span class="list-col category-col">Prog by</span>
						<span class="list-col dimensions-col">Checked by</span>
						<span class="list-col date-col">Last Updated</span>
						<span class="list-col actions-col">Actions</span>
					</div>
					{#each drawingItems as drawing, index}
						<DrawingRow {drawing} {index} onDelete={() => openDeleteModal(drawing)} />
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
		{creating}
		onClose={closeModal}
		onSelectTemplate={selectTemplate}
		onCreate={createDrawing}
	/>
{/if}

{#if showDeleteModal && deleteDrawing}
	<DeleteConfirmModal
		drawingTitle={deleteDrawing.title}
		{deleting}
		onClose={closeDeleteModal}
		onConfirm={() => deleteFormEl?.requestSubmit()}
	/>
	<form
		method="POST"
		action="?/delete"
		use:enhance={() => {
			deleting = true;
			return async ({ result, update }) => {
				handleDeleteResult(result);
				await update();
			};
		}}
		class="delete-form"
		bind:this={deleteFormEl}
	>
		<input type="hidden" name="drawing_id" value={deleteDrawing.id} />
		<button type="submit" class="sr-only">Confirm delete</button>
	</form>
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
		grid-template-columns: 1.8fr 1fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr 0.6fr;
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

	.delete-form {
		display: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.toaster {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 1100;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-2xl);
		animation: toasterSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		min-width: 300px;
	}

	@keyframes toasterSlideIn {
		from {
			transform: translateX(100%) translateY(0);
			opacity: 0;
		}
		to {
			transform: translateX(0) translateY(0);
			opacity: 1;
		}
	}

	.toaster.success {
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.toaster.error {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.toaster-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-full);
	}

	.toaster-message {
		flex: 1;
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-sm);
	}

	.toaster-close {
		background: none;
		border: none;
		color: inherit;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		margin-left: var(--spacing-sm);
		line-height: 1;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.toaster-close:hover {
		opacity: 1;
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
