<script lang="ts">
	import type { WearcoTemplate } from '$lib/types/template'

	let { data } = $props<{ templates: WearcoTemplate[]; error?: string }>();

	function formatJson(obj: Record<string, any>): string {
		return JSON.stringify(obj, null, 2);
	}
</script>

<h1>Templates</h1>

<p>Manage your templates here.</p>

<nav>
	<a href="/templates/edit">Edit Template</a>
	<a href="/templates/print">Print Template</a>
</nav>

<main>
	{#if data.error}
		<p class="error">Error loading templates: {data.error}</p>
	{:else if data.templates && data.templates.length > 0}
		<table>
			<thead>
				<tr>
					<th>ID</th>
					<th>Template Name</th>
					<th>Template Code</th>
					<th>Customer</th>
					<th>Category</th>
					<th>Dimension Schema</th>
					<th>Template Data</th>
					<th>Created By</th>
					<th>Created At</th>
					<th>Updated At</th>
				</tr>
			</thead>
			<tbody>
				{#each data.templates as template}
					<tr>
						<td>{template.id}</td>
						<td>{template.template_name}</td>
						<td>{template.template_code || ''}</td>
						<td>{template.customer || ''}</td>
						<td>{template.category}</td>
						<td><pre>{formatJson(template.dimension_schema)}</pre></td>
						<td><pre>{formatJson(template.template_data)}</pre></td>
						<td>{template.created_by || ''}</td>
						<td>{new Date(template.created_at).toLocaleString()}</td>
						<td>{new Date(template.updated_at).toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>No templates found. <a href="/templates/edit">Create your first template</a>.</p>
	{/if}
</main>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th, td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	th {
		background-color: #f2f2f2;
		font-weight: bold;
	}

	tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	tr:hover {
		background-color: #f5f5f5;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-size: 0.9em;
	}

	.error {
		color: red;
		font-weight: bold;
	}
</style>