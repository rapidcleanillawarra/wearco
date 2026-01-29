<script lang="ts">
	let { data } = $props();
</script>

<h1>Edit Template</h1>

<p>Edit your template content here.</p>

<nav>
	<a href="/templates">← Back to Templates</a>
</nav>

<main>
	<!-- Template editor content will go here -->
	<div>
		<label for="template-content">Template Content:</label>
		<textarea id="template-content" rows="10" cols="50" placeholder="Enter your template content here..."></textarea>
	</div>

	<div>
		<button type="button">Save Changes</button>
		<button type="button">Preview</button>
	</div>
</main>