<script lang="ts">
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";

	let { data } = $props<{
		data: PageData;
	}>();

	const template = $derived(data.template);
	const pdfUrl = $derived(data.pdfUrl);
	const error = $derived(data.error);

	// Form state for saving drawings (if needed)
	let isSaving = $state(false);
</script>

<div class="page-container-dark drawings-page">
	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-section">
				<h1 class="title-gradient">
					{template?.template_name || "Drawing Viewer"}
				</h1>
				<p class="subtitle">
					View and interact with your drawing template
				</p>
			</div>
			<div class="header-actions">
				{#if template}
					<form
						method="POST"
						action="?/save"
						use:enhance={() => {
							isSaving = true;
							return async ({ update }) => {
								await update();
								isSaving = false;
							};
						}}
					>
						<input
							type="hidden"
							name="templateId"
							value={template.id}
						/>
						<button class="btn-primary" disabled={isSaving}>
							{#if isSaving}
								<span class="spinner"></span>
								Saving...
							{:else}
								Save Drawing
							{/if}
						</button>
					</form>
				{/if}
				<a href="/drawings" class="btn-ghost">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M19 12H5" />
						<path d="M12 19l-7-7 7-7" />
					</svg>
					Back to Templates
				</a>
			</div>
		</div>
	</header>

	<main class="templates-main">
		{#if error}
			<div class="error-state">
				<span class="error-icon">⚠️</span>
				<p>Error loading drawing: {error}</p>
			</div>
		{:else if !template}
			<div class="error-state">
				<span class="error-icon">📄</span>
				<p>No template found</p>
			</div>
		{:else}
			<section class="section-card pdf-viewer-section">
				<div class="section-header">
					<h2>{template.template_name}</h2>
					{#if template.description}
						<p class="section-description">
							{template.description}
						</p>
					{/if}
				</div>

				{#if pdfUrl}
					<!-- PDF Viewer Component -->
					<div class="pdf-viewer-container">
						<iframe
							src="{pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH"
							class="pdf-iframe"
							title={template.template_name}
							allowfullscreen
						></iframe>
					</div>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">📄</div>
						<h3>No PDF Document</h3>
						<p>
							This template doesn't have an associated PDF
							document.
						</p>
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>

<style>
	.page-container-dark {
		min-height: 100vh;
		background: var(--gradient-dark);
		color: var(--color-white);
		padding: var(--spacing-xl) var(--spacing-2xl);
		font-family: var(--font-primary);
	}

	.page-header {
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom: var(--border-light);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-lg);
	}

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

	.subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: var(--font-size-base);
	}

	.header-actions {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.templates-main {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		width: 100%;
		max-width: 1600px;
		margin: 0 auto;
	}

	.section-card {
		background: var(--gradient-card);
		border: var(--border-subtle);
		border-radius: var(--radius-2xl);
		padding: var(--spacing-xl);
		box-shadow: var(--shadow-md);
	}

	.section-header {
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-md);
		border-bottom: var(--border-light);
	}

	.section-header h2 {
		color: var(--color-white);
		font-size: var(--font-size-2xl);
		margin: 0;
	}

	.section-description {
		color: var(--color-gray);
		margin: var(--spacing-sm) 0 0 0;
		font-size: var(--font-size-base);
	}

	.pdf-viewer-container {
		width: 100%;
		min-height: 600px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: rgba(0, 0, 0, 0.3);
		border: var(--border-light);
	}

	.pdf-iframe {
		width: 100%;
		height: 100%;
		min-height: 600px;
		border: none;
		background: var(--color-white);
	}

	.empty-state {
		text-align: center;
		padding: 4rem var(--spacing-xl);
	}

	.empty-state-icon {
		font-size: 4rem;
		margin-bottom: var(--spacing-md);
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: var(--font-size-2xl);
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-white);
	}

	.empty-state p {
		color: var(--color-gray);
		margin: 0 0 var(--spacing-lg) 0;
	}

	.error-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		padding: var(--spacing-xl);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-xl);
		color: var(--color-error);
	}

	.error-icon {
		font-size: 1.5rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: 0.75rem 1.5rem;
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

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-gold-lg);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(255, 255, 255, 0.05);
		border: var(--border-light);
		color: var(--color-gray);
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: var(--transition-normal);
		text-decoration: none;
	}

	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-white);
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: var(--radius-full);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-container-dark {
			padding: var(--spacing-lg);
		}

		.title-section h1 {
			font-size: var(--font-size-3xl);
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}

		.btn-primary,
		.btn-ghost {
			justify-content: center;
		}

		.section-card {
			padding: var(--spacing-md);
		}

		.pdf-viewer-container {
			min-height: 400px;
		}

		.pdf-iframe {
			min-height: 400px;
		}

		.empty-state {
			padding: 2rem var(--spacing-md);
		}
	}
</style>
