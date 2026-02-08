<script lang="ts">
	import SearchableSelect from "$lib/components/SearchableSelect.svelte";

	let {
		viewMode = $bindable(),
		searchQuery = $bindable(),
		selectedCustomer = $bindable(),
		customers = [],
		onOpenModal,
	} = $props<{
		viewMode: "card" | "list";
		searchQuery: string;
		selectedCustomer: string;
		customers: string[];
		onOpenModal: () => void;
	}>();

	const customerOptions = $derived(
		customers.map((c) => ({ id: c, label: c })),
	);
</script>

<header class="page-header">
	<div class="header-content">
		<div class="title-section">
			<h1 class="title-gradient">Drawings</h1>
			<p class="subtitle">Manage your drawings and work orders</p>
		</div>

		<div class="filters-section">
			<div class="search-box">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					type="text"
					placeholder="Search drawings..."
					bind:value={searchQuery}
				/>
			</div>

			<div class="customer-filter">
				<SearchableSelect
					bind:value={selectedCustomer}
					options={customerOptions}
					placeholder="All Customers"
				/>
			</div>
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
	.filters-section {
		display: flex;
		gap: var(--spacing-md);
		flex: 1;
		max-width: 600px;
	}

	.search-box {
		position: relative;
		flex: 1.5;
		display: flex;
		align-items: center;
	}

	.search-box svg {
		position: absolute;
		left: 12px;
		color: var(--color-gray);
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 10px 12px 10px 40px;
		background: rgba(255, 255, 255, 0.05);
		border: var(--border-light);
		border-radius: var(--radius-lg);
		color: var(--color-white);
		font-size: var(--font-size-sm);
		transition: var(--transition-smooth);
	}

	.search-box input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--color-gold);
		box-shadow: 0 0 0 3px rgba(250, 194, 17, 0.1);
	}

	.customer-filter {
		flex: 1;
		min-width: 200px;
	}

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

	@media (max-width: 1024px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-lg);
		}

		.filters-section {
			max-width: none;
		}
	}

	@media (max-width: 640px) {
		.filters-section {
			flex-direction: column;
		}

		.customer-filter {
			min-width: 0;
		}
	}
</style>
