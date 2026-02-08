<script lang="ts">
	import type { PageData } from "./$types";
	import type { DrawingFormData } from "../types";
	import type { TemplateData } from "./types";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import PdfViewer from "./components/PdfViewer.svelte";
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgDiagramViewer from "./components/SvgDiagramViewer.svelte";
	import FullSvgViewer from "./components/FullSvgViewer.svelte";
	import { exportPdfWithOverlay } from "./utils/pdfExport";
	import type { WearcoDiagram } from "$lib/types/svg_diagram";

	let { data } = $props<{
		data: PageData;
	}>();

	// Extract data from the new structure
	const mode = $derived(data.mode);
	const template = $derived(data.template);
	const drawing = $derived(data.drawing);
	const diagrams = $derived(data.diagrams);
	const orderedDiagrams = $derived(
		[...(diagrams || [])].sort(
			(a: WearcoDiagram, b: WearcoDiagram) =>
				(a.layout_order ?? 0) - (b.layout_order ?? 0),
		),
	);
	const pdfUrl = $derived(data.pdfUrl);

	// Parse template data for overlay fields
	const templateData = $derived<TemplateData | null>(
		template?.template_data as TemplateData | null,
	);

	// Drawing form data - mutable state that can be updated by overlay fields
	let drawingFormData = $state<DrawingFormData>({
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

	// Initialize drawingFormData when template or drawing changes
	$effect(() => {
		if (!template) {
			drawingFormData = {
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
			};
			return;
		}

		// Start with template defaults (additional_data holds overlay values, not template structure)
		const baseData: DrawingFormData = {
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
			additional_data: {},
			drawing_data: {},
		};

		// Override with drawing data if in edit mode
		if (mode === "edit" && drawing) {
			drawingFormData = {
				...baseData,
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
		} else {
			drawingFormData = baseData;
		}
	});

	// Mutable state for field value updates (user input)
	let fieldUpdateState = $state<Record<string, string>>({});

	// PDF dimensions state - will be set by PdfViewer via callback
	let pdfDimensions = $state<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	$effect(() => {
		// pdfDimensions tracking effect
	});

	// Resolve target field: support both targetField and targetFieldf (legacy typo from template editor)
	function getTargetField(field: {
		targetField?: string;
		targetFieldf?: string;
	}): string {
		const t = field.targetField || field.targetFieldf || "";
		return (typeof t === "string" ? t : "").trim();
	}

	// Overlay field values derived from additional_data or drawingFormData fields, merged with user updates
	const overlayFieldValues = $derived.by<Record<string, string>>(() => {
		if (!templateData?.fields) return {};

		const values: Record<string, string> = {};
		templateData.fields.forEach((field) => {
			const targetField = getTargetField(field);
			// If field has a targetField, read from drawingFormData
			if (targetField !== "") {
				const targetValue =
					drawingFormData[targetField as keyof DrawingFormData];
				// Handle different types (string, number)
				if (typeof targetValue === "string") {
					values[field.id] =
						fieldUpdateState[field.id] ?? targetValue ?? "";
				} else if (typeof targetValue === "number") {
					values[field.id] =
						fieldUpdateState[field.id] ?? String(targetValue ?? "");
				} else {
					values[field.id] = fieldUpdateState[field.id] ?? "";
				}
			} else {
				// No targetField - use value from additional_data
				values[field.id] =
					fieldUpdateState[field.id] ??
					((drawingFormData.additional_data?.[field.id] as string) ||
						"");
			}
		});
		return values;
	});

	async function handleExportPdf() {
		if (!pdfUrl) return;

		try {
			const filename = drawing?.name
				? `${drawing.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
				: "drawing.pdf";

			if (
				templateData?.fields &&
				templateData.pageWidth &&
				templateData.pageHeight
			) {
				await exportPdfWithOverlay({
					pdfUrl,
					fieldValues: overlayFieldValues,
					fields: templateData.fields,
					pageWidth: templateData.pageWidth,
					pageHeight: templateData.pageHeight,
					filename,
				});
			} else {
				// Fallback: Fetch the original blob to ensure clean download
				const response = await fetch(pdfUrl);
				if (!response.ok)
					throw new Error("Network response was not ok");

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.style.display = "none";
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (err) {
			alert("Failed to download PDF. Please try again.");
		}
	}

	// Form state for saving drawings (if needed)
	let isSaving = $state(false);

	// Handle overlay field updates
	function handleOverlayFieldUpdate(fieldId: string, value: string) {
		// Find the field definition to check if it has a targetField
		const field = templateData?.fields.find((f) => f.id === fieldId);

		// Update the mutable state which will trigger re-derivation
		fieldUpdateState[fieldId] = value;

		const targetFieldName = field ? getTargetField(field) : "";
		// If field has a targetField (and it's not empty), update drawingFormData
		if (targetFieldName !== "") {
			const targetField = targetFieldName as keyof DrawingFormData;

			// Check the type of the target field to handle conversion
			if (targetField === "quantity") {
				// Convert to number for quantity field
				drawingFormData[targetField] = Number(value) || (0 as any);
			} else if (
				targetField === "job_number" ||
				targetField === "work_order" ||
				targetField === "drawing_number" ||
				targetField === "name" ||
				targetField === "customer" ||
				targetField === "customer_source" ||
				targetField === "dl" ||
				targetField === "checked_by" ||
				targetField === "prog_by" ||
				targetField === "material" ||
				targetField === "thk"
			) {
				// String fields
				drawingFormData[targetField] = value as any;
			}
			// Note: additional_data and drawing_data are not updated via targetField
		}
	}

	// Handle overlay field blur events
	function handleOverlayFieldBlur(fieldId: string) {
		// Find the field definition to check if it has a targetField
		const field = templateData?.fields.find((f) => f.id === fieldId);
		const targetFieldName = field ? getTargetField(field) : "";

		console.log("Blur debug:", {
			fieldId,
			field,
			targetFieldName,
			currentOverlayValue: overlayFieldValues[fieldId],
			drawingFormDataBefore: { ...drawingFormData },
		});

		// If field has a targetField (and it's not empty), update drawingFormData
		if (targetFieldName !== "") {
			const targetField = targetFieldName as keyof DrawingFormData;
			const currentValue = overlayFieldValues[fieldId] || "";

			// Check the type of the target field to handle conversion
			if (targetField === "quantity") {
				// Convert to number for quantity field
				drawingFormData[targetField] =
					Number(currentValue) || (0 as any);
			} else if (
				targetField === "job_number" ||
				targetField === "work_order" ||
				targetField === "drawing_number" ||
				targetField === "name" ||
				targetField === "customer" ||
				targetField === "customer_source" ||
				targetField === "dl" ||
				targetField === "checked_by" ||
				targetField === "prog_by" ||
				targetField === "material" ||
				targetField === "thk"
			) {
				// String fields
				drawingFormData[targetField] = currentValue as any;
			}
			// Note: additional_data and drawing_data are not updated via targetField
		}

		// Create overlay values with targetTo property
		const overlayValuesWithTargets: Record<
			string,
			{ value: string; targetTo: string }
		> = {};
		if (templateData?.fields) {
			templateData.fields.forEach((field) => {
				const targetField = getTargetField(field);
				overlayValuesWithTargets[field.id] = {
					value: overlayFieldValues[field.id] || "",
					targetTo: targetField,
				};
			});
		}

		console.log("Overlay field blur:", {
			overlayValues: overlayValuesWithTargets,
			drawingData: { ...drawingFormData },
		});
	}
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
						onsubmit={async (e) => {
							e.preventDefault(); // Explicitly prevent form submission

							if (isSaving) return;

							isSaving = true;
							console.log("Saving to database:", {
								mode,
								templateId: template?.id,
								drawingId: drawing?.id,
								drawingFormData,
							});

							try {
								const formElement = e.target as HTMLFormElement;
								const formData = new FormData(formElement);

								const response = await fetch(
									formElement.action,
									{
										method: "POST",
										body: formData,
										headers: {
											"x-sveltekit-action": "true",
										},
									},
								);

								const result = await response.json();

								if (result.type === "success") {
									// Parse the actual action data from the result.data string
									const actionData = JSON.parse(result.data);

									// Handle URL redirection for new drawings
									if (
										mode === "new" &&
										actionData?.drawingId
									) {
										// Preserve existing query parameters except template_id
										const url = new URL(
											window.location.href,
										);
										url.searchParams.set(
											"id",
											actionData.drawingId,
										);
										url.searchParams.delete("template_id");

										// Update URL without page reload, maintaining history
										goto(url.toString(), {
											replaceState: false,
										});
									} else {
										// For updates, just show success message
										console.log(
											"Drawing updated successfully",
										);
									}
								} else {
									console.error("Server error:", result);
									alert(
										`Failed to save drawing: ${result?.error?.message || "Unknown error"}`,
									);
								}
							} catch (error) {
								console.error("Network error:", error);
								alert(
									"Failed to save drawing. Please check your connection and try again.",
								);
							} finally {
								isSaving = false;
							}
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
						<!-- Hidden inputs for drawingFormData fields -->
						<input
							type="hidden"
							name="job_number"
							value={drawingFormData.job_number}
						/>
						<input
							type="hidden"
							name="work_order"
							value={drawingFormData.work_order}
						/>
						<input
							type="hidden"
							name="drawing_number"
							value={drawingFormData.drawing_number}
						/>
						<input
							type="hidden"
							name="name"
							value={drawingFormData.name}
						/>
						<input
							type="hidden"
							name="customer"
							value={drawingFormData.customer}
						/>
						<input
							type="hidden"
							name="customer_source"
							value={drawingFormData.customer_source}
						/>
						<input
							type="hidden"
							name="quantity"
							value={drawingFormData.quantity}
						/>
						<input
							type="hidden"
							name="dl"
							value={drawingFormData.dl}
						/>
						<input
							type="hidden"
							name="checked_by"
							value={drawingFormData.checked_by}
						/>
						<input
							type="hidden"
							name="prog_by"
							value={drawingFormData.prog_by}
						/>
						<input
							type="hidden"
							name="material"
							value={drawingFormData.material}
						/>
						<input
							type="hidden"
							name="thk"
							value={drawingFormData.thk}
						/>
						<!-- Hidden inputs for overlay field values (fields without targetField go to additional_data) -->
						<input
							type="hidden"
							name="additional_data"
							value={JSON.stringify({
								...drawingFormData.additional_data,
								...Object.fromEntries(
									Object.entries(fieldUpdateState).filter(
										([fieldId]) => {
											const field =
												templateData?.fields.find(
													(f) => f.id === fieldId,
												);
											// Only include fields without targetField or with empty targetField
											return (
												!field ||
												getTargetField(field) === ""
											);
										},
									),
								),
							})}
						/>
						<button
							class="btn-primary"
							disabled={isSaving}
							type="submit"
						>
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
				<PdfViewer url={pdfUrl} {templateData} bind:pdfDimensions>
					{#if templateData?.fields && templateData.pageWidth && templateData.pageHeight}
						<PdfOverlay
							fields={templateData.fields}
							templateWidth={templateData.pageWidth}
							templateHeight={templateData.pageHeight}
							pdfWidth={pdfDimensions.width}
							pdfHeight={pdfDimensions.height}
							fieldValues={overlayFieldValues}
							onFieldUpdate={handleOverlayFieldUpdate}
							onFieldBlur={handleOverlayFieldBlur}
						/>
					{/if}
				</PdfViewer>
			</div>
		</section>

		{#if orderedDiagrams && orderedDiagrams.length > 0}
			<div class="svg-diagrams-container">
				{#each orderedDiagrams as diagram}
					<div class="diagram-item">
						<FullSvgViewer
							{diagram}
							fieldValues={overlayFieldValues}
						/>
					</div>
				{/each}
			</div>
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

	.diagrams-section {
		padding: var(--spacing-lg);
	}

	.section-header {
		margin-bottom: var(--spacing-lg);
	}

	.section-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		margin: 0 0 var(--spacing-xs) 0;
		color: var(--color-white);
	}

	.section-subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.diagrams-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-md);
	}

	.svg-diagrams-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-xl);
		align-items: start;
	}

	.diagram-item {
		width: 100%;
	}

	@media (max-width: 1024px) {
		.svg-diagrams-grid {
			grid-template-columns: 1fr;
		}
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

		.diagrams-grid {
			grid-template-columns: 1fr;
		}

		.diagram-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.diagram-type {
			align-self: flex-start;
			margin-left: 0;
		}
	}
</style>
