<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	// Get the optional id parameter from the URL
	const id = $derived($page.params.id);

	// Determine if we're creating or editing
	const isEditing = $derived(!!id);
</script>

<div class="edit-template-page">
	<header class="template-header">
		<nav>
			<a href="/templates">← Back to Templates</a>
		</nav>
		<div class="header-actions">
			<button type="button">{isEditing ? 'Save Changes' : 'Create Template'}</button>
			{#if isEditing}
				<button type="button">Preview</button>
			{/if}
		</div>
	</header>

	<main class="template-main">
		<div class="a4-canvas">
			<div class="content-box"></div>
		</div>
	</main>
</div>

<style>
	.edit-template-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.template-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		flex-shrink: 0;
	}

	.template-header nav {
		display: flex;
		align-items: center;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.template-main {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 1rem;
		background: #f5f5f5;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.a4-canvas {
		width: 297mm;
		height: 210mm;
		box-sizing: border-box;
		border: 1px solid #ccc;
		padding: 1cm;
		background: #fff;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	:global(body) {
		margin: 0;
	}
</style>