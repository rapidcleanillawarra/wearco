<script lang="ts">
	import type { PageData } from "./$types";
	import type { DrawingFormData } from "../types";
	import type { TemplateData, TemplateField } from "./types";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { deserialize } from "$app/forms";
	import type { ActionResult } from "@sveltejs/kit";
	import PdfViewer from "./components/PdfViewer.svelte";
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import OverlayFieldsMobileInterleaved from "./components/OverlayFieldsMobileInterleaved.svelte";
	import FullSvgViewer from "./components/FullSvgViewer.svelte";
	import {
		exportPdfWithOverlay,
		generatePdfAsBase64,
	} from "./utils/pdfExport";
	import type { WearcoDiagram } from "$lib/types/svg_diagram";

	let { data } = $props<{
		data: PageData;
	}>();

	// Extract data from the new structure
	const mode = $derived(data.mode);
	const template = $derived(data.template);
	const drawing = $derived(data.drawing);
	const diagrams = $derived(data.diagrams);

	/** Parse diagram section "title#order" → { title, order }. Missing → "Other", order 999 */
	function parseDiagramSection(sectionStr: string | null | undefined): {
		title: string;
		order: number;
	} {
		const s = (sectionStr ?? "").trim();
		if (!s) return { title: "Other", order: 999 };
		const idx = s.indexOf("#");
		if (idx === -1) return { title: s || "Other", order: 0 };
		const title = s.slice(0, idx).trim() || "Other";
		const order = parseInt(s.slice(idx + 1).trim(), 10);
		return { title, order: Number.isNaN(order) ? 999 : order };
	}

	/** Diagrams grouped by section, sections and diagrams sorted by section order. */
	const orderedDiagramsBySection = $derived.by(() => {
		const list = diagrams ?? [];
		const map = new Map<
			string,
			{ order: number; diagrams: WearcoDiagram[] }
		>();
		const sectionTitles: string[] = [];

		for (const d of list) {
			const { title, order } = parseDiagramSection(d.section);
			if (!map.has(title)) {
				map.set(title, { order: 999, diagrams: [] });
				sectionTitles.push(title);
			}
			const entry = map.get(title)!;
			entry.diagrams.push(d);
			if (title !== "Other" && order < entry.order) entry.order = order;
		}

		for (const entry of map.values()) {
			entry.diagrams.sort((a, b) => {
				const oA = parseDiagramSection(a.section).order;
				const oB = parseDiagramSection(b.section).order;
				if (oA !== oB) return oA - oB;
				return (a.layout_order ?? 0) - (b.layout_order ?? 0);
			});
		}

		const withOrder = sectionTitles.map((title) => ({
			title,
			...map.get(title)!,
		}));
		withOrder.sort((a, b) => a.order - b.order);
		return withOrder;
	});

	/** Flat list of diagrams in section order (for backward compatibility / desktop grid). */
	const orderedDiagrams = $derived(
		orderedDiagramsBySection.flatMap((s) => s.diagrams),
	);

	const pdfUrl = $derived(data.pdfUrl);

	// Parse template data for overlay fields
	const templateData = $derived<TemplateData | null>(
		template?.template_data as TemplateData | null,
	);

	/** Normalize section title for matching (e.g. "center edge" and "center-edge" → "center-edge"). */
	function normalizeSectionKey(s: string): string {
		return s
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-");
	}

	/** Parse field section "title#order" → { title, order }. Same convention as diagram section. */
	function parseFieldSection(sectionStr: string | undefined): {
		title: string;
		order: number;
	} {
		const s = (sectionStr ?? "").trim();
		if (!s) return { title: "Other", order: 999 };
		const idx = s.indexOf("#");
		if (idx === -1) return { title: s || "Other", order: 0 };
		const title = s.slice(0, idx).trim() || "Other";
		const order = parseInt(s.slice(idx + 1).trim(), 10);
		return { title, order: Number.isNaN(order) ? 999 : order };
	}

	/** Unified sections for mobile: fields and diagrams merged by normalized key, ordered by section order. */
	const unifiedMobileSections = $derived.by(() => {
		const fields = templateData?.fields ?? [];
		const diagramSections = orderedDiagramsBySection ?? [];
		const map = new Map<
			string,
			{
				order: number;
				displayTitle: string;
				fields: TemplateField[];
				diagrams: WearcoDiagram[];
			}
		>();

		for (const field of fields) {
			const { title, order } = parseFieldSection(field.sections);
			const key = normalizeSectionKey(title);
			if (!map.has(key)) {
				map.set(key, {
					order: 999,
					displayTitle: title,
					fields: [],
					diagrams: [],
				});
			}
			const entry = map.get(key)!;
			entry.fields.push(field);
			if (title !== "Other" && order < entry.order) entry.order = order;
		}

		for (const { title, diagrams, order } of diagramSections) {
			const key = normalizeSectionKey(title);
			if (!map.has(key)) {
				map.set(key, {
					order: 999,
					displayTitle: title,
					fields: [],
					diagrams: [],
				});
			}
			const entry = map.get(key)!;
			entry.diagrams.push(...diagrams);
			if (title !== "Other" && order < entry.order) entry.order = order;
		}

		// Sort fields within each section by parseFieldSection order
		for (const entry of map.values()) {
			entry.fields.sort((a, b) => {
				const oA = parseFieldSection(a.sections).order;
				const oB = parseFieldSection(b.sections).order;
				return oA - oB;
			});
		}

		const result = Array.from(map.entries())
			.map(([key, entry]) => ({
				key,
				displayTitle: entry.displayTitle,
				order: entry.order,
				fields: entry.fields,
				diagrams: entry.diagrams,
			}))
			.filter((s) => s.fields.length > 0 || s.diagrams.length > 0)
			.sort((a, b) => a.order - b.order);
		return result;
	});

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
		purchase_order: "",
		drawing_data: {
			overlay_data: {},
			pitchConfig: [],
		},
	});

	// SVG Configs State (for pitches) - lifted from FullSvgViewer
	let svgConfigs = $state<{
		svg_configs: Array<{
			diagram_id: string;
			pitch_config: Array<{
				from: number;
				to: number;
				prefix: string;
				suffix: string;
			}>;
		}>;
	}>({
		svg_configs: [],
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
				purchase_order: "",
				drawing_data: {
					overlay_data: {},
					pitchConfig: [],
				},
			};
			svgConfigs = { svg_configs: [] };
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
			purchase_order: "",
			drawing_data: {
				overlay_data: {},
				pitchConfig: [],
			},
		};

		// Override with drawing data if in edit mode
		if (mode === "edit" && drawing) {
			const drawing_data = (drawing.drawing_data as any) || {};
			const overlay_data = drawing_data.overlay_data || {};
			const pitchConfig = drawing_data.pitchConfig || [];

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
				purchase_order: drawing.purchase_order || "",
				drawing_data: {
					overlay_data,
					pitchConfig,
				},
			};

			// Initialize svgConfigs from pitchConfig
			if (pitchConfig && Array.isArray(pitchConfig)) {
				svgConfigs = { svg_configs: pitchConfig };
			} else {
				svgConfigs = { svg_configs: [] };
			}
		} else {
			drawingFormData = baseData;
			svgConfigs = { svg_configs: [] };
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
				// No targetField - use value from drawing_data.overlay_data
				values[field.id] =
					fieldUpdateState[field.id] ??
					((drawingFormData.drawing_data?.overlay_data?.[
						field.id
					] as string) ||
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

	// Toaster notification state
	let toaster = $state<{
		show: boolean;
		type: "success" | "error";
		message: string;
	}>({
		show: false,
		type: "success",
		message: "",
	});

	function showToaster(type: "success" | "error", message: string) {
		toaster = { show: true, type, message };
		// Auto-hide after 4 seconds
		setTimeout(() => {
			toaster = { ...toaster, show: false };
		}, 4000);
	}

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
				targetField === "purchase_order"
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
				targetField === "purchase_order"
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

	async function sendPdfToPowerAutomate() {
		if (
			!pdfUrl ||
			!templateData?.fields ||
			!templateData.pageWidth ||
			!templateData.pageHeight
		) {
			console.warn("Missing data for Power Automate export", {
				pdfUrl: !!pdfUrl,
				fields: !!templateData?.fields,
				dimensions: !!(
					templateData?.pageWidth && templateData?.pageHeight
				),
			});
			return;
		}

		try {
			console.log("Exporting PDF for Power Automate...");
			const base64Pdf = await generatePdfAsBase64({
				pdfUrl,
				fieldValues: overlayFieldValues,
				fields: templateData.fields,
				pageWidth: templateData.pageWidth,
				pageHeight: templateData.pageHeight,
			});

			console.log("Sending PDF to Power Automate...");
			const powerAutomateUrl =
				"https://default61576f99244849ec8803974b47673f.57.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dee13aab7f5d404f96eaf27662d6804c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oGaWVW5WMyxfegKCQqJ-Z0uANoxF7Pv-pl3RoskO8Hs";

			const paResponse = await fetch(powerAutomateUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pdf: base64Pdf,
					job_number: drawingFormData.work_order,
				}),
			});

			if (paResponse.ok) {
				console.log("PDF sent to Power Automate successfully");
			} else {
				console.error(
					"Failed to send PDF to Power Automate:",
					paResponse.status,
				);
			}
		} catch (exportErr) {
			console.error("Error during Power Automate PDF export:", exportErr);
		}
	}
</script>

<div class="page-container-dark drawings-page">
	{#if toaster.show}
		<div class="toaster {toaster.type}">
			<span class="toaster-icon">
				{#if toaster.type === "success"}
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{:else}
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				{/if}
			</span>
			<span class="toaster-message">{toaster.message}</span>
			<button
				class="toaster-close"
				onclick={() => (toaster = { ...toaster, show: false })}
				aria-label="Close notification"
			>
				&times;
			</button>
		</div>
	{/if}

	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-section">
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
							<strong>Purchase Order:</strong>
							{drawing.purchase_order || "Not set"}
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

							// Validation: job_number is required
							if (
								!drawingFormData.job_number ||
								drawingFormData.job_number.trim() === ""
							) {
								showToaster(
									"error",
									"Job Number is required before saving.",
								);
								return;
							}

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

								const responseText = await response.text();
								const result = deserialize(
									responseText,
								) as ActionResult;

								if (result.type === "success") {
									const actionData = result.data as any;

									showToaster(
										"success",
										mode === "new"
											? "Drawing created successfully"
											: "Drawing updated successfully",
									);

									// Trigger Power Automate export for both modes
									sendPdfToPowerAutomate();

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
									}
								} else {
									console.error("Server error:", result);
									let errorMessage = "Unknown error";
									if (result.type === "failure") {
										errorMessage =
											(result.data?.message as string) ||
											"Validation failed";
									} else if (result.type === "error") {
										errorMessage =
											result.error?.message ||
											"Server error";
									}

									showToaster(
										"error",
										`Failed to save drawing: ${errorMessage}`,
									);
								}
							} catch (error) {
								console.error("Network error:", error);
								showToaster(
									"error",
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
							name="purchase_order"
							value={drawingFormData.purchase_order}
						/>
						<!-- Hidden inputs for drawing_data structure -->
						<input
							type="hidden"
							name="drawing_data"
							value={JSON.stringify({
								overlay_data: {
									...drawingFormData.drawing_data
										?.overlay_data,
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
								},
								pitchConfig: svgConfigs.svg_configs,
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

		{#if unifiedMobileSections.length > 0}
			<div class="mobile-overlay-section">
				<OverlayFieldsMobileInterleaved
					sections={unifiedMobileSections}
					fieldValues={overlayFieldValues}
					onFieldUpdate={handleOverlayFieldUpdate}
					onFieldBlur={handleOverlayFieldBlur}
					bind:svgConfigs
				/>
			</div>
		{/if}

		{#if orderedDiagramsBySection && orderedDiagramsBySection.length > 0}
			<div class="diagrams-wrapper">
				{#each orderedDiagramsBySection as { title, diagrams }}
					<div class="diagram-section">
						<h3 class="diagram-section-title">{title.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
						<div
							class="svg-diagrams-container"
							class:single-column={diagrams.length === 1}
						>
							{#each diagrams as diagram (diagram.id)}
								<div class="diagram-item">
									<FullSvgViewer
										{diagram}
										fieldValues={overlayFieldValues}
										onFieldUpdate={handleOverlayFieldUpdate}
										bind:svgConfigs
									/>
								</div>
							{/each}
						</div>
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
		padding: var(--spacing-lg) var(--spacing-md);
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
		font-size: clamp(var(--font-size-2xl), 5vw, var(--font-size-4xl));
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

	.mobile-overlay-section {
		display: none;
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
		gap: var(--spacing-lg);
		align-items: start;
	}

	.svg-diagrams-container.single-column {
		grid-template-columns: 1fr;
	}

	.diagram-item {
		width: 100%;
	}

	.diagrams-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.diagram-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.diagram-section-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		margin: 0;
		color: var(--color-white);
		text-transform: capitalize;
	}

	/* Toaster notifications */
	.toaster {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-2xl);
		animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		min-width: 300px;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%) translateY(0);
			opacity: 0;
		}
		to {
			transform: translateX(0) translateY(0);
			opacity: 1;
		}
	}

	.toaster.success {
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.toaster.error {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.toaster-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-full);
	}

	.toaster-message {
		flex: 1;
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-sm);
	}

	.toaster-close {
		background: none;
		border: none;
		color: inherit;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		margin-left: var(--spacing-sm);
		line-height: 1;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.toaster-close:hover {
		opacity: 1;
	}

	@media (max-width: 1024px) {
		.svg-diagrams-container {
			grid-template-columns: 1fr;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
			align-items: stretch;
		}

		.btn-primary,
		.btn-secondary,
		.btn-ghost {
			width: 100%;
			justify-content: center;
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
			padding: var(--spacing-sm) 0;
		}

		.page-header {
			padding-left: var(--spacing-xs);
			padding-right: var(--spacing-xs);
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

		.pdf-viewer-section {
			display: none;
		}

		.mobile-overlay-section {
			display: block;
			padding: 0;
		}

		.diagrams-wrapper {
			display: none;
		}

		.diagram-section-title {
			font-size: var(--font-size-sm);
			margin-bottom: var(--spacing-xs);
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
