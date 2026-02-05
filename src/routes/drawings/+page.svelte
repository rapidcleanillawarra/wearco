<script lang="ts">
	import type { WearcoDrawing, WearcoTemplate } from "$lib/types/template";

	let { data } = $props<{
		data: {
			drawings?: WearcoDrawing[];
			templates?: WearcoTemplate[];
			error?: string;
		};
	}>();

	// Safe access to drawings from wearco_drawings (merged layout + page data)
	const drawings = $derived(data?.drawings ?? []);
	const templates = $derived(data?.templates ?? []);
	const loadError = $derived(data?.error);

	// View mode state
	let viewMode: "card" | "list" = $state("card");

	// Modal state
	let showModal = $state(false);
	let selectedTemplateId: string | null = $state(null);

	// Helper function to get template icon
	function getTemplateIcon(template: WearcoTemplate): string {
		return template.image_display || "📐";
	}

	// Helper function to check if value is a valid image source
	function isImageSrc(value: string | null): value is string {
		return (
			value !== null &&
			(value.startsWith("http://") ||
				value.startsWith("https://") ||
				value.startsWith("data:") ||
				value.startsWith("/"))
		);
	}

	// Helper function to get gradient based on category
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

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

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
			// Navigate to the drawing editor with template_id
			window.location.href = `/drawings/drawing-edge?template_id=${selectedTemplateId}`;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && showModal) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="templates-container">
	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-section">
				<h1>Drawings</h1>
				<p class="subtitle">Manage your drawings and work orders</p>
			</div>
			<div class="header-actions">
				<!-- View Toggle -->
				<div class="view-toggle">
					<button
						class="toggle-btn"
						class:active={viewMode === "card"}
						onclick={() => (viewMode = "card")}
						aria-label="Card view"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="7" height="7" rx="1" />
							<rect x="14" y="3" width="7" height="7" rx="1" />
							<rect x="3" y="14" width="7" height="7" rx="1" />
							<rect x="14" y="14" width="7" height="7" rx="1" />
						</svg>
					</button>
					<button
						class="toggle-btn"
						class:active={viewMode === "list"}
						onclick={() => (viewMode = "list")}
						aria-label="List view"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</div>

				<!-- New Drawing Button -->
				<button class="new-template-btn" onclick={openModal}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					<span>New Drawing</span>
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="templates-main">
		{#if loadError}
			<div class="error-state">
				<span class="error-icon">⚠️</span>
				<p>Error loading drawings: {loadError}</p>
			</div>
		{:else}
			<!-- Card View -->
			{#if viewMode === "card"}
				<div class="cards-grid">
					{#each drawings as drawing, index}
						<article
							class="template-card"
							style="--animation-delay: {index * 0.1}s"
						>
							<div class="card-thumbnail">
								<span class="thumbnail-icon">📐</span>
								<div class="card-badge">
									{drawing.quantity || 1} pcs
								</div>
							</div>
							<div class="card-content">
								<h3 class="card-title">
									{drawing.name ||
										drawing.drawing_number ||
										`Drawing ${drawing.id.slice(0, 8)}`}
								</h3>
								<p class="card-code">
									{drawing.job_number ||
										drawing.work_order ||
										"No Job #"}
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
											<path
												d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
											/>
											<circle cx="12" cy="7" r="4" />
										</svg>
										{drawing.customer || "No Customer"}
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
											<line
												x1="16"
												y1="2"
												x2="16"
												y2="6"
											/>
											<line x1="8" y1="2" x2="8" y2="6" />
											<line
												x1="3"
												y1="10"
												x2="21"
												y2="10"
											/>
										</svg>
										{formatDate(drawing.updated_at)}
									</span>
								</div>
								<div class="card-dimensions">
									<span class="dimension"
										>{drawing.material ||
											"No Material"}</span
									>
									<span class="separator">•</span>
									<span class="holes"
										>{drawing.thk || "No Thickness"}</span
									>
								</div>
							</div>
							<div class="card-actions">
								<a
									href="/drawings/edit/{drawing.id}"
									class="action-btn edit-btn"
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
										<rect
											x="9"
											y="9"
											width="13"
											height="13"
											rx="2"
											ry="2"
										/>
										<path
											d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
										/>
									</svg>
									Duplicate
								</button>
							</div>
						</article>
					{/each}
				</div>

				<!-- List View -->
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
					{#each drawings as drawing, index}
						<div
							class="list-row"
							style="--animation-delay: {index * 0.05}s"
						>
							<span class="list-col name-col">
								<span class="row-icon">📐</span>
								<span class="row-name"
									>{drawing.name ||
										drawing.drawing_number ||
										`Drawing ${drawing.id.slice(0, 8)}`}</span
								>
							</span>
							<span class="list-col code-col"
								>{drawing.job_number ||
									drawing.work_order ||
									"No Job #"}</span
							>
							<span class="list-col customer-col"
								>{drawing.customer || "No Customer"}</span
							>
							<span class="list-col category-col">
								<span class="category-badge"
									>{drawing.material || "No Material"}</span
								>
							</span>
							<span class="list-col dimensions-col">
								{drawing.thk || "No Thickness"}
							</span>
							<span class="list-col date-col"
								>{formatDate(drawing.updated_at)}</span
							>
							<span class="list-col actions-col">
								<a
									href="/drawings/edit/{drawing.id}"
									class="row-action"
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
										<rect
											x="9"
											y="9"
											width="13"
											height="13"
											rx="2"
											ry="2"
										/>
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
					{/each}
				</div>
			{/if}

			{#if drawings.length === 0}
				<div class="empty-state">
					<h3>No drawings yet</h3>
					<p>Create your first drawing to get started</p>
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Modal Overlay -->
{#if showModal}
	<div
		class="modal-overlay"
		onclick={closeModal}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-container" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Create New Drawing</h2>
				<p class="modal-subtitle">Select a drawing type to begin</p>
				<button
					class="modal-close"
					onclick={closeModal}
					aria-label="Close modal"
				>
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
						<p>
							No templates available. Please add templates in the
							database.
						</p>
					</div>
				{:else}
					<div class="drawing-types-grid">
						{#each templates as template, index}
							<button
								class="drawing-type-card"
								class:selected={selectedTemplateId ===
									template.id}
								onclick={() => selectTemplate(template.id)}
								style="--animation-delay: {index * 0.1}s"
							>
								<div
									class="type-icon-wrapper"
									style="background: {getTemplateGradient(
										template.category,
									)}"
								>
									{#if template.image_display && isImageSrc(template.image_display)}
										<img
											src={template.image_display}
											alt=""
											class="type-icon-img"
										/>
									{:else}
										<span class="type-icon"
											>{getTemplateIcon(template)}</span
										>
									{/if}
								</div>
								<div class="type-info">
									<h3 class="type-name">
										{template.template_name}
									</h3>
									<p class="type-description">
										{template.description ||
											"No description available"}
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
						{/each}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="cancel-btn" onclick={closeModal}>Cancel</button>
				<button
					class="create-btn"
					onclick={createDrawing}
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
{/if}

<style>
	/* Drawings Page - Page-specific styles only
	   Uses global styles from src/lib/styles for common components */

	/* Container - uses global gradient variable */
	.templates-container {
		min-height: 100vh;
		background: var(--gradient-dark);
		color: var(--color-white);
		padding: var(--spacing-xl) var(--spacing-2xl);
		font-family: var(--font-primary);
	}

	/* Title styling */
	.title-section h1 {
		font-size: var(--font-size-4xl);
		font-weight: var(--font-weight-bold);
		margin: 0 0 var(--spacing-sm) 0;
		background: var(--gradient-title);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: shimmer 3s ease-in-out infinite;
	}

	/* View Toggle */
	.view-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-lg);
		padding: 4px;
		border: var(--border-light);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 36px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-gray);
		cursor: pointer;
		transition: var(--transition-smooth);
	}

	.toggle-btn:hover {
		color: var(--color-white);
		background: rgba(255, 255, 255, 0.1);
	}

	.toggle-btn.active {
		background: var(--color-gold);
		color: var(--color-black);
		box-shadow: var(--shadow-gold);
	}

	/* New Template Button - extends global btn-primary */
	.new-template-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0.75rem var(--spacing-lg);
		background: var(--gradient-button);
		color: var(--color-black);
		border: none;
		border-radius: var(--radius-lg);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-gold);
	}

	.new-template-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-gold-lg);
	}

	.new-template-btn:active {
		transform: translateY(0);
	}

	/* Cards Grid */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--spacing-lg);
	}

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

	/* List View */
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

	/* Error Icon */
	.error-icon {
		font-size: 1.5rem;
	}

	/* Modal - Page-specific extensions */
	.modal-header h2 {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-semibold);
		margin: 0 0 var(--spacing-xs) 0;
		background: var(--gradient-title);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

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

	/* Modal buttons */
	.cancel-btn {
		padding: 0.75rem var(--spacing-lg);
		background: transparent;
		border: var(--border-medium);
		border-radius: var(--radius-lg);
		color: var(--color-gray);
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-normal);
	}

	.cancel-btn:hover {
		border-color: rgba(255, 255, 255, 0.4);
		color: var(--color-white);
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0.75rem 1.75rem;
		background: var(--gradient-button);
		border: none;
		border-radius: var(--radius-lg);
		color: var(--color-black);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-gold);
	}

	.create-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-gold-lg);
	}

	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-btn svg {
		transition: var(--transition-normal);
	}

	.create-btn:hover:not(:disabled) svg {
		transform: translateX(4px);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.templates-container {
			padding: var(--spacing-md);
		}

		.title-section h1 {
			font-size: var(--font-size-3xl);
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.list-header,
		.list-row {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}

		.list-header {
			display: none;
		}

		.list-row {
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

		.drawing-types-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
