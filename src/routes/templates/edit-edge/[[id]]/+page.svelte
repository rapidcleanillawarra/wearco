<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	// Get the optional id parameter from the URL
	const id = $derived($page.params.id);

	// Determine if we're creating or editing
	const isEditing = $derived(!!id);
</script>

<h1>{isEditing ? 'Edit Template' : 'Create Template'}</h1>

<p>{isEditing ? 'Edit your template content here.' : 'Create a new template here.'}</p>

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
		<button type="button">{isEditing ? 'Save Changes' : 'Create Template'}</button>
		{#if isEditing}
			<button type="button">Preview</button>
		{/if}
	</div>

	{#if isEditing}
		<div>
			<p><strong>Template ID:</strong> {id}</p>
		</div>
	{/if}
</main>