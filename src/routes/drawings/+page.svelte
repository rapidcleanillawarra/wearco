<script lang="ts">
	import type { WearcoDrawing } from "$lib/types/template";

	let { data } = $props<{ drawings: WearcoDrawing[]; error?: string }>();

	// View mode state
	let viewMode: "card" | "list" = $state("card");

	// Modal state
	let showModal = $state(false);
	let selectedDrawingType: string | null = $state(null);


	// Drawing types for the modal
	const drawingTypes = [
		{
			id: "center-edge",
			name: "Center Edge Drawing",
			description: "Symmetrical hole pattern centered on the edge",
			icon: "📐",
			gradient: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
		},
		{
			id: "end-edge",
			name: "End Edge Drawing",
			description: "Hole pattern aligned to edge endpoints",
			icon: "📏",
			gradient: "linear-gradient(135deg, #2a2a2a 0%, #444 100%)",
		},
		{
			id: "custom-layout",
			name: "Custom Layout",
			description: "Create a fully customized drawing layout",
			icon: "🔧",
			gradient: "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)",
		},
		{
			id: "perforation-grid",
			name: "Perforation Grid",
			description: "Grid-based perforation pattern design",
			icon: "⚙️",
			gradient: "linear-gradient(135deg, #252525 0%, #404040 100%)",
		},
	];

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	function openModal() {
		showModal = true;
		selectedDrawingType = null;
	}

	function closeModal() {
		showModal = false;
		selectedDrawingType = null;
	}

	function selectDrawingType(typeId: string) {
		selectedDrawingType = typeId;
	}

	function createDrawing() {
		if (selectedDrawingType) {
			// Navigate to the appropriate drawing editor
			if (
				selectedDrawingType === "center-edge" ||
				selectedDrawingType === "end-edge"
			) {
				window.location.href = `/drawings/drawing-edge`;
			} else {
				// For other types, we can add more navigation later
				window.location.href = `/drawings/drawing-edge`;
			}
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
				<p class="subtitle">
					Manage your drawings and work orders
				</p>
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
		{#if data.error}
			<div class="error-state">
				<span class="error-icon">⚠️</span>
				<p>Error loading templates: {data.error}</p>
			</div>
		{:else}
			<!-- Card View -->
			{#if viewMode === "card"}
				<div class="cards-grid">
					{#each data.drawings as drawing, index}
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
									{drawing.name || drawing.drawing_number || `Drawing ${drawing.id.slice(0, 8)}`}
								</h3>
								<p class="card-code">
									{drawing.job_number || drawing.work_order || 'No Job #'}
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
										{drawing.customer || 'No Customer'}
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
									<span class="dimension">{drawing.material || 'No Material'}</span>
									<span class="separator">•</span>
									<span class="holes">{drawing.thk || 'No Thickness'}</span>
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
					{#each data.drawings as drawing, index}
						<div
							class="list-row"
							style="--animation-delay: {index * 0.05}s"
						>
							<span class="list-col name-col">
								<span class="row-icon">📐</span>
								<span class="row-name"
									>{drawing.name || drawing.drawing_number || `Drawing ${drawing.id.slice(0, 8)}`}</span
								>
							</span>
							<span class="list-col code-col"
								>{drawing.job_number || drawing.work_order || 'No Job #'}</span
							>
							<span class="list-col customer-col"
								>{drawing.customer || 'No Customer'}</span
							>
							<span class="list-col category-col">
								<span class="category-badge"
									>{drawing.material || 'No Material'}</span
								>
							</span>
							<span class="list-col dimensions-col">
								{drawing.thk || 'No Thickness'}
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

			{#if data.drawings.length === 0}
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
				<div class="drawing-types-grid">
					{#each drawingTypes as type, index}
						<button
							class="drawing-type-card"
							class:selected={selectedDrawingType === type.id}
							onclick={() => selectDrawingType(type.id)}
							style="--animation-delay: {index * 0.1}s"
						>
							<div
								class="type-icon-wrapper"
								style="background: {type.gradient}"
							>
								<span class="type-icon">{type.icon}</span>
							</div>
							<div class="type-info">
								<h3 class="type-name">{type.name}</h3>
								<p class="type-description">
									{type.description}
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
			</div>

			<div class="modal-footer">
				<button class="cancel-btn" onclick={closeModal}>Cancel</button>
				<button
					class="create-btn"
					onclick={createDrawing}
					disabled={!selectedDrawingType}
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
	/* Color Theme Variables */
	:root {
		--color-black: #000000;
		--color-gold: #fac211;
		--color-white: #ffffff;
		--color-gray: #aaaaaa;
		--color-dark-gray: #1a1a1a;
		--color-light-gray: #f5f5f5;
	}

	/* Global Reset */
	:global(html, body) {
		margin: 0;
		padding: 0;
	}

	/* Container Styles */
	.templates-container {
		min-height: 100vh;
		background: linear-gradient(
			135deg,
			#0a0a0a 0%,
			#1a1a1a 50%,
			#0f0f0f 100%
		);
		color: var(--color-white);
		padding: 2rem 3rem;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		box-sizing: border-box;
	}

	/* Header Styles */
	.page-header {
		margin-bottom: 2.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.title-section h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(
			135deg,
			var(--color-white) 0%,
			var(--color-gold) 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}

	.subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: 1rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* View Toggle */
	.view-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		padding: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 36px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: var(--color-gray);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toggle-btn:hover {
		color: var(--color-white);
		background: rgba(255, 255, 255, 0.1);
	}

	.toggle-btn.active {
		background: var(--color-gold);
		color: var(--color-black);
		box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
	}

	/* New Template Button */
	.new-template-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, var(--color-gold) 0%, #e5af0e 100%);
		color: var(--color-black);
		border: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 20px rgba(250, 194, 17, 0.3);
	}

	.new-template-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(250, 194, 17, 0.4);
	}

	.new-template-btn:active {
		transform: translateY(0);
	}

	/* Cards Grid */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.template-card {
		background: linear-gradient(
			145deg,
			rgba(30, 30, 30, 0.9) 0%,
			rgba(20, 20, 20, 0.95) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: cardFadeIn 0.6s ease-out backwards;
		animation-delay: var(--animation-delay);
	}

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.template-card:hover {
		transform: translateY(-6px);
		border-color: rgba(250, 194, 17, 0.3);
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(250, 194, 17, 0.1);
	}

	.card-thumbnail {
		height: 120px;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.card-thumbnail::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
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
		transition: all 0.3s ease;
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
		font-size: 0.7rem;
		font-weight: 600;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.card-content {
		padding: 1.25rem;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: var(--color-white);
	}

	.card-code {
		color: var(--color-gold);
		font-size: 0.85rem;
		margin: 0 0 0.75rem 0;
		font-family: "JetBrains Mono", monospace;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
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
		gap: 0.5rem;
	}

	.separator {
		color: rgba(255, 255, 255, 0.2);
	}

	.card-actions {
		display: flex;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.9rem;
		background: transparent;
		border: none;
		color: var(--color-gray);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
	}

	.action-btn:first-child {
		border-right: 1px solid rgba(255, 255, 255, 0.06);
	}

	.action-btn:hover {
		background: rgba(250, 194, 17, 0.1);
		color: var(--color-gold);
	}

	/* List View */
	.list-container {
		background: rgba(20, 20, 20, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		overflow: hidden;
	}

	.list-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-gray);
	}

	.list-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
		gap: 1rem;
		padding: 1rem 1.5rem;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		transition: all 0.3s ease;
		animation: rowSlideIn 0.4s ease-out backwards;
		animation-delay: var(--animation-delay);
	}

	@keyframes rowSlideIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
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
		font-weight: 500;
		color: var(--color-white);
	}

	.code-col {
		font-family: "JetBrains Mono", monospace;
		color: var(--color-gold);
		font-size: 0.85rem;
	}

	.category-badge {
		display: inline-block;
		padding: 4px 10px;
		background: rgba(250, 194, 17, 0.15);
		color: var(--color-gold);
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 6px;
	}

	.actions-col {
		display: flex;
		gap: 0.5rem;
	}

	.row-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: var(--color-gray);
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
	}

	.row-action:hover {
		background: rgba(250, 194, 17, 0.2);
		border-color: var(--color-gold);
		color: var(--color-gold);
	}

	.row-action.delete:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: #ef4444;
		color: #ef4444;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-white);
	}

	.empty-state p {
		color: var(--color-gray);
		margin: 0 0 1.5rem 0;
	}

	/* Error State */
	.error-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 12px;
		color: #ef4444;
	}

	.error-icon {
		font-size: 1.5rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
		padding: 1rem;
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
		width: 100%;
		max-width: 680px;
		max-height: 90vh;
		background: linear-gradient(145deg, #1e1e1e 0%, #151515 100%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		overflow: hidden;
		animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		display: flex;
		flex-direction: column;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		padding: 1.75rem 2rem 1.25rem;
		position: relative;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		background: linear-gradient(
			135deg,
			var(--color-white) 0%,
			var(--color-gold) 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.modal-subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: 0.95rem;
	}

	.modal-close {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: var(--color-gray);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-white);
		transform: rotate(90deg);
	}

	.modal-body {
		padding: 1.5rem 2rem;
		overflow-y: auto;
	}

	.drawing-types-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.drawing-type-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		background: rgba(30, 30, 30, 0.6);
		border: 2px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		animation: typeCardFadeIn 0.5s ease-out backwards;
		animation-delay: var(--animation-delay);
		text-align: center;
	}

	@keyframes typeCardFadeIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.drawing-type-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(
			circle at 50% 0%,
			rgba(250, 194, 17, 0.1) 0%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.drawing-type-card:hover {
		border-color: rgba(250, 194, 17, 0.4);
		transform: translateY(-4px);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
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
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 16px;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
	}

	.drawing-type-card:hover .type-icon-wrapper {
		transform: scale(1.1);
	}

	.type-icon {
		font-size: 2rem;
	}

	.type-info {
		position: relative;
		z-index: 1;
	}

	.type-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.35rem 0;
		color: var(--color-white);
	}

	.type-description {
		font-size: 0.8rem;
		color: var(--color-gray);
		margin: 0;
		line-height: 1.4;
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
		border-radius: 50%;
		color: var(--color-black);
		opacity: 0;
		transform: scale(0);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.drawing-type-card.selected .type-check {
		opacity: 1;
		transform: scale(1);
	}

	.modal-footer {
		padding: 1.25rem 2rem;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(0, 0, 0, 0.2);
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		color: var(--color-gray);
		font-weight: 500;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cancel-btn:hover {
		border-color: rgba(255, 255, 255, 0.4);
		color: var(--color-white);
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.75rem;
		background: linear-gradient(135deg, var(--color-gold) 0%, #e5af0e 100%);
		border: none;
		border-radius: 10px;
		color: var(--color-black);
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 20px rgba(250, 194, 17, 0.3);
	}

	.create-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(250, 194, 17, 0.4);
	}

	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.create-btn svg {
		transition: transform 0.3s ease;
	}

	.create-btn:hover:not(:disabled) svg {
		transform: translateX(4px);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.templates-container {
			padding: 1rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			justify-content: space-between;
		}

		.title-section h1 {
			font-size: 2rem;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.list-header,
		.list-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.list-header {
			display: none;
		}

		.list-row {
			padding: 1rem;
		}

		.list-col {
			display: flex;
			justify-content: space-between;
			padding: 0.25rem 0;
		}

		.list-col::before {
			content: attr(data-label);
			font-weight: 600;
			color: var(--color-gray);
			font-size: 0.75rem;
			text-transform: uppercase;
		}

		.drawing-types-grid {
			grid-template-columns: 1fr;
		}

		.modal-container {
			max-height: 95vh;
		}
	}
</style>
