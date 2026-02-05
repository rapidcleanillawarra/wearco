<script lang="ts">
	let {
		viewMode = $bindable(),
		onOpenModal,
	} = $props<{
		viewMode: "card" | "list";
		onOpenModal: () => void;
	}>();
</script>

<header class="page-header">
	<div class="header-content">
		<div class="title-section">
			<h1 class="title-gradient">Drawings</h1>
			<p class="subtitle">Manage your drawings and work orders</p>
		</div>
		<div class="header-actions">
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

			<button class="btn-primary" onclick={onOpenModal}>
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

<style>
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
</style>
