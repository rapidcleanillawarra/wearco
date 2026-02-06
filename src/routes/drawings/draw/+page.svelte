<script lang="ts">
	import type { PageData } from "./$types";
	import type { DrawingFormData } from "../types";
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";
	import * as pdfjsLib from "pdfjs-dist";

	// Set worker source
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).toString();

	let { data } = $props<{
		data: PageData;
	}>();

	// Extract data from the new structure
	const mode = $derived(data.mode);
	const template = $derived(data.template);
	const drawing = $derived(data.drawing);
	const pdfUrl = $derived(data.pdfUrl);

	// Drawing form data - merged from template + drawing
	let drawingFormData: DrawingFormData = $state({
		job_number: "",
		work_order: "",
		drawing_number: "",
		name: "",
		customer: "",
		customer_source: "",
		quantity: 0,
		dl: "",
		checked_by: "",
		prog_by: "",
		material: "",
		thk: "",
		additional_data: {},
		drawing_data: {},
	});

	// PDF Viewer State
	let pdfDoc: any = $state(null);
	let pdfContainer: HTMLDivElement | undefined = $state();
	let isLoadingPdf = $state(false);
	let pdfError = $state<string | null>(null);

	// Initialize form data when data loads
	$effect(() => {
		if (template) {
			// Start with template defaults
			drawingFormData = {
				job_number: "",
				work_order: "",
				drawing_number: "",
				name: template.template_name || "",
				customer: "",
				customer_source: "",
				quantity: 0,
				dl: "",
				checked_by: "",
				prog_by: "",
				material: "",
				thk: "",
				additional_data: template.template_data || {},
				drawing_data: {},
			};

			// Override with drawing data if in edit mode
			if (mode === "edit" && drawing) {
				drawingFormData = {
					...drawingFormData,
					job_number: drawing.job_number || "",
					work_order: drawing.work_order || "",
					drawing_number: drawing.drawing_number || "",
					name: drawing.name || template.template_name || "",
					customer: drawing.customer || "",
					customer_source: drawing.customer_source || "",
					quantity: drawing.quantity || 0,
					dl: drawing.dl || "",
					checked_by: drawing.checked_by || "",
					prog_by: drawing.prog_by || "",
					material: drawing.material || "",
					thk: drawing.thk || "",
					additional_data:
						drawing.additional_data || template.template_data || {},
				};
			}
		}
	});

	// Load PDF when URL is available
	$effect(() => {
		if (pdfUrl && pdfContainer) {
			loadPdf(pdfUrl);
		}
	});

	async function loadPdf(url: string) {
		if (!url) return;

		try {
			isLoadingPdf = true;
			pdfError = null;

			// Clear existing content
			if (pdfContainer) {
				pdfContainer.innerHTML = "";
			}

			const loadingTask = pdfjsLib.getDocument(url);
			pdfDoc = await loadingTask.promise;

			// Render all pages
			for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
				await renderPage(pageNum);
			}
		} catch (err: any) {
			console.error("Error loading PDF:", err);
			pdfError = err.message || "Failed to load PDF";
		} finally {
			isLoadingPdf = false;
		}
	}

	async function renderPage(pageNum: number) {
		if (!pdfDoc || !pdfContainer) return;

		try {
			const page = await pdfDoc.getPage(pageNum);

			// create canvas for the page
			const canvas = document.createElement("canvas");
			canvas.className = "pdf-page-canvas";
			pdfContainer.appendChild(canvas);

			// Adjust scale to fit container width, but maintain high quality
			const containerWidth = pdfContainer.clientWidth - 40; // minus padding
			const unscaledViewport = page.getViewport({ scale: 1 });
			const scale = containerWidth / unscaledViewport.width;
			// Ensure a minimum scale for readability if container is small
			const finalScale = Math.max(scale, 1.0);

			const viewport = page.getViewport({ scale: finalScale });

			// Set canvas dimensions
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// High DPI support
			const dpr = window.devicePixelRatio || 1;
			canvas.style.width = `${viewport.width}px`;
			canvas.style.height = `${viewport.height}px`;
			canvas.width = viewport.width * dpr;
			canvas.height = viewport.height * dpr;
			const context = canvas.getContext("2d");

			if (context) {
				context.scale(dpr, dpr);

				const renderContext = {
					canvasContext: context,
					viewport: viewport,
				};

				await page.render(renderContext).promise;
			}
		} catch (err) {
			console.error(`Error rendering page ${pageNum}:`, err);
		}
	}

	async function handleExportPdf() {
		if (!pdfUrl) return;

		try {
			// Fetch the original blob to ensure clean download
			const response = await fetch(pdfUrl);
			if (!response.ok) throw new Error("Network response was not ok");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = url;
			// Name the file
			const filename = drawing?.name
				? `${drawing.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
				: "drawing.pdf";
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error("Error downloading PDF:", err);
			alert("Failed to download PDF. Please try again.");
		}
	}

	// Form state for saving drawings (if needed)
	let isSaving = $state(false);
</script>

<div class="page-container-dark drawings-page">
	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-section">
				<div class="mode-indicator">
					<span class="mode-badge mode-{mode}">
						{mode === "new" ? "New Drawing" : "Edit Drawing"}
					</span>
				</div>
				<h1 class="title-gradient">
					{mode === "edit" && drawing?.name
						? drawing.name
						: template?.template_name || "Drawing Editor"}
				</h1>
				<p class="subtitle">
					{mode === "new"
						? "Create a new drawing from template"
						: `Editing drawing ${drawing?.drawing_number || ""} - Job: ${drawing?.job_number || ""}`}
				</p>
				{#if mode === "edit" && drawing}
					<div class="drawing-meta">
						<span class="meta-item">
							<strong>Customer:</strong>
							{drawing.customer || "Not set"}
						</span>
						<span class="meta-item">
							<strong>Material:</strong>
							{drawing.material || "Not set"}
						</span>
						<span class="meta-item">
							<strong>Quantity:</strong>
							{drawing.quantity || 0}
						</span>
						<span class="meta-item">
							<strong>Last Updated:</strong>
							{new Date(drawing.updated_at).toLocaleDateString()}
						</span>
					</div>
				{/if}
			</div>
			<div class="header-actions">
				<!-- Export PDF Button -->
				{#if pdfUrl}
					<button
						class="btn-secondary"
						onclick={handleExportPdf}
						aria-label="Export PDF"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
							/>
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Export PDF
					</button>
				{/if}

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
						{#if mode === "edit" && drawing}
							<input
								type="hidden"
								name="drawingId"
								value={drawing.id}
							/>
						{/if}
						<button class="btn-primary" disabled={isSaving}>
							{#if isSaving}
								<span class="spinner"></span>
								Saving...
							{:else}
								{mode === "new"
									? "Create Drawing"
									: "Update Drawing"}
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
					Back to Drawings
				</a>
			</div>
		</div>
	</header>

	<main class="templates-main">
		<section class="section-card pdf-viewer-section">
			<div class="section-content">
				{#if pdfUrl}
					<div class="pdf-viewer-wrapper">
						{#if isLoadingPdf}
							<div class="loading-state">
								<span class="spinner-large"></span>
								<p>Loading PDF...</p>
							</div>
						{/if}

						{#if pdfError}
							<div class="error-state">
								<p>Error: {pdfError}</p>
							</div>
						{/if}

						<!-- Container for PDF Canvases -->
						<div
							bind:this={pdfContainer}
							class="pdf-canvas-container"
						></div>
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
			</div>
		</section>
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

	.mode-indicator {
		margin-bottom: var(--spacing-sm);
	}

	.mode-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mode-new {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.mode-edit {
		background: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
		border: 1px solid rgba(59, 130, 246, 0.3);
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
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--font-size-base);
	}

	.drawing-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-md);
		border: var(--border-light);
	}

	.meta-item {
		font-size: var(--font-size-sm);
		color: var(--color-gray);
	}

	.meta-item strong {
		color: var(--color-white);
		margin-right: var(--spacing-xs);
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

	.pdf-viewer-section {
		padding: 0;
		overflow: hidden;
	}

	.section-content {
		position: relative;
		width: 100%;
		min-height: 600px;
	}

	.pdf-viewer-wrapper {
		width: 100%;
		background: rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-lg);
		min-height: 600px;
	}

	.pdf-canvas-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: 100%;
		align-items: center;
	}

	/* Style for dynamic canvases */
	:global(.pdf-page-canvas) {
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border-radius: var(--radius-sm);
		max-width: 100%;
		height: auto !important; /* Allow aspect ratio to remain */
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: var(--color-gray);
		width: 100%;
	}

	.error-state {
		color: #ef4444;
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

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-white);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-lg);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-smooth);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
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

	.spinner-large {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-primary-dim);
		border-top-color: var(--color-primary);
		border-radius: var(--radius-full);
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--spacing-md);
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
		.btn-secondary,
		.btn-ghost {
			justify-content: center;
		}

		.section-card {
			padding: var(--spacing-md);
		}

		.section-content {
			min-height: 400px;
		}

		.pdf-viewer-wrapper {
			min-height: 400px;
			padding: var(--spacing-sm);
		}

		.empty-state {
			padding: 2rem var(--spacing-md);
		}
	}
</style>
