<script lang="ts">
	let { data } = $props();
</script>

<h1>Print Template</h1>

<p>Print your template here.</p>

<nav>
	<a href="/templates">← Back to Templates</a>
	<a href="/templates/edit">Edit Template</a>
</nav>

<main>
	<!-- Print preview content will go here -->
	<div class="print-preview">
		<h2>Print Preview</h2>
		<div class="template-content">
			<!-- Template content for printing will be displayed here -->
			<p>Your template content will appear here for printing.</p>
		</div>

		<div class="print-controls">
			<button type="button" onclick={() => window.print()}>Print</button>
			<button type="button">Download PDF</button>
		</div>
	</div>
</main>

<style>
	.print-preview {
		border: 1px solid #ccc;
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
	}

	.template-content {
		border: 1px dashed #999;
		padding: 20px;
		margin: 20px 0;
		min-height: 200px;
		background-color: #f9f9f9;
	}

	.print-controls {
		text-align: center;
		margin-top: 20px;
	}

	.print-controls button {
		margin: 0 10px;
		padding: 10px 20px;
		font-size: 16px;
	}
</style>