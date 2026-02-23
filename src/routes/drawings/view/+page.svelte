<script lang="ts">
	import type { PageData } from "./$types";
	import type { TemplateData } from "./types";
	import type { WearcoDiagram } from "$lib/types/svg_diagram";
	import { SvelteMap } from "svelte/reactivity";
	import ViewPdfWithOverlay from "./components/ViewPdfWithOverlay.svelte";
	import ViewSvgDiagram from "./components/ViewSvgDiagram.svelte";
	import {
		generatePdfDoc,
		createPdfWithPdfPageOnly,
	} from "../draw/utils/pdfExport";
	import html2canvas from "html2canvas";

	let { data } = $props<{ data: PageData }>();

	const drawing = $derived(data.drawing);
	const template = $derived(data.template);
	const diagrams = $derived(data.diagrams);
	const pdfUrl = $derived(data.pdfUrl);

	const templateData = $derived<TemplateData | null>(
		template?.template_data as TemplateData | null,
	);

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

	const orderedDiagramsBySection = $derived.by(() => {
		const list = diagrams ?? [];
		const map = new SvelteMap<string, { order: number; diagrams: WearcoDiagram[] }>();
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

	function getTargetField(field: {
		targetField?: string;
		targetFieldf?: string;
	}): string {
		const t = field.targetField || field.targetFieldf || "";
		return (typeof t === "string" ? t : "").trim();
	}

	interface DrawingFields {
		job_number: string;
		work_order: string;
		drawing_number: string;
		name: string;
		customer: string;
		customer_source: string;
		quantity: number;
		dl: string;
		checked_by: string;
		prog_by: string;
		purchase_order: string;
		drawing_data: Record<string, any>;
		[key: string]: any;
	}

	const drawingFields = $derived.by<DrawingFields>(() => {
		const d = drawing;
		const drawingData = (d?.drawing_data as any) || {};
		return {
			job_number: d?.job_number || "",
			work_order: d?.work_order || "",
			drawing_number: d?.drawing_number || "",
			name: d?.name || template?.template_name || "",
			customer: d?.customer || "",
			customer_source: d?.customer_source || "",
			quantity: d?.quantity || 0,
			dl: d?.dl || "",
			checked_by: d?.checked_by || "",
			prog_by: d?.prog_by || "",
			purchase_order: d?.purchase_order || "",
			drawing_data: {
				overlay_data: drawingData.overlay_data || {},
				pitchConfig: drawingData.pitchConfig || [],
			},
		};
	});

	const overlayFieldValues = $derived.by<Record<string, string>>(() => {
		if (!templateData?.fields) return {};

		const values: Record<string, string> = {};
		templateData.fields.forEach((field) => {
			const targetField = getTargetField(field);
			if (targetField !== "") {
				const targetValue = drawingFields[targetField];
				if (typeof targetValue === "string") {
					values[field.id] = targetValue ?? "";
				} else if (typeof targetValue === "number") {
					values[field.id] = String(targetValue ?? "");
				} else {
					values[field.id] = "";
				}
			} else {
				const raw = drawingFields.drawing_data?.overlay_data?.[field.id];
				values[field.id] = raw != null ? String(raw) : "";
			}
		});
		return values;
	});

	const svgConfigs = $derived.by(() => {
		const drawingData = (drawing?.drawing_data as any) || {};
		const pitchConfig = drawingData.pitchConfig || [];
		return Array.isArray(pitchConfig) ? pitchConfig : [];
	});

	function getPitchConfigForDiagram(diagramId: string) {
		const config = svgConfigs.find((c: any) => c.diagram_id === diagramId);
		return config?.pitch_config ?? [
			{ from: 1, to: 2, prefix: "", suffix: "" },
		];
	}

	let isExporting = $state(false);
	let viewPageEl: HTMLDivElement | undefined = $state();

	async function handleExport() {
		if (!pdfUrl) return;
		isExporting = true;
		try {
			const filename = drawing?.name
				? `${drawing.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
				: "drawing.pdf";

			let doc: import("jspdf").jsPDF;

			if (
				templateData?.fields &&
				templateData.pageWidth &&
				templateData.pageHeight
			) {
				doc = await generatePdfDoc({
					pdfUrl,
					fieldValues: overlayFieldValues,
					fields: templateData.fields,
					pageWidth: templateData.pageWidth,
					pageHeight: templateData.pageHeight,
				});
			} else {
				doc = await createPdfWithPdfPageOnly(pdfUrl);
			}

			// Add diagram sections as next pages (A4 landscape)
			const sectionEls = viewPageEl?.querySelectorAll<HTMLElement>(
				".diagram-section",
			);
			if (sectionEls?.length) {
				const pageW = 841.89;
				const pageH = 595.28; // A4 landscape pt
				const pxToPt = 72 / 96; // 1 CSS px ≈ 0.75 pt

				for (const section of sectionEls) {
					const canvas = await html2canvas(section, {
						scale: 2,
						useCORS: true,
						logging: false,
						backgroundColor: "#ffffff",
					});
					const imgData = canvas.toDataURL("image/jpeg", 0.95);
					const imgWpt = canvas.width * pxToPt;
					const imgHpt = canvas.height * pxToPt;
					const scale = Math.min(pageW / imgWpt, pageH / imgHpt);
					const w = imgWpt * scale;
					const h = imgHpt * scale;
					const x = (pageW - w) / 2;
					const y = (pageH - h) / 2;

					doc.addPage([pageW, pageH], "l");
					doc.addImage(imgData, "JPEG", x, y, w, h);
				}
			}

			doc.save(filename);
		} catch (err) {
			alert("Failed to export PDF. Please try again.");
		} finally {
			isExporting = false;
		}
	}
</script>

<div class="view-page" bind:this={viewPageEl}>
	<header class="view-toolbar">
		<a href="/drawings" class="view-toolbar-back">← Back to Drawings</a>
		{#if pdfUrl}
			<button
				class="view-print-btn"
				onclick={handleExport}
				disabled={isExporting}
				aria-label="Export PDF"
			>
				{#if isExporting}
					<span class="view-print-spinner"></span>
					Exporting…
				{:else}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Export PDF
				{/if}
			</button>
		{/if}
	</header>
	<section class="pdf-section">
		<ViewPdfWithOverlay
			url={pdfUrl}
			{templateData}
			fieldValues={overlayFieldValues}
		/>
	</section>

	{#if orderedDiagramsBySection && orderedDiagramsBySection.length > 0}
		{#each orderedDiagramsBySection as { title, diagrams: sectionDiagrams } (title)}
			<section class="diagram-section">
				<h2 class="section-title">{title.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h2>
				<div
					class="diagrams-grid"
					class:single-column={sectionDiagrams.length === 1}
				>
					{#each sectionDiagrams as diagram (diagram.id)}
						<div class="diagram-item">
							<ViewSvgDiagram
								{diagram}
								fieldValues={overlayFieldValues}
								pitchConfigs={getPitchConfigForDiagram(diagram.id)}
							/>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: white;
	}

	.view-page {
		background: white;
		color: #000;
		font-family: Helvetica, Arial, sans-serif;
		max-width: 100%;
	}

	.view-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 16px;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.view-toolbar-back {
		color: #4b5563;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
	}

	.view-toolbar-back:hover {
		color: #1e1b4b;
	}

	.view-print-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #1e1b4b;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.view-print-btn:hover:not(:disabled) {
		background: #312e81;
	}

	.view-print-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.view-print-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: view-spin 0.7s linear infinite;
	}

	@keyframes view-spin {
		to { transform: rotate(360deg); }
	}

	.pdf-section {
		width: 100%;
	}

	.diagram-section {
		padding: 16px;
		break-inside: avoid;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 12px 0;
		padding-bottom: 6px;
		border-bottom: 1px solid #e5e7eb;
		color: #1e1b4b;
	}

	.diagrams-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	.diagrams-grid.single-column {
		grid-template-columns: 1fr;
	}

	.diagram-item {
		overflow: hidden;
		break-inside: avoid;
	}

	@media print {
		:global(body) {
			margin: 0;
			padding: 0;
		}

		.view-toolbar {
			display: none !important;
		}

		.view-page {
			max-width: 100%;
		}

		.pdf-section {
			break-after: page;
		}

		.diagram-section {
			break-inside: avoid;
		}

		.diagram-item {
			break-inside: avoid;
		}
	}
</style>
