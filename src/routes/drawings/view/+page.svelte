<script lang="ts">
	import type { PageData } from "./$types";
	import type { TemplateData } from "./types";
	import type { WearcoDiagram } from "$lib/types/svg_diagram";
	import { SvelteMap } from "svelte/reactivity";
	import ViewPdfWithOverlay from "./components/ViewPdfWithOverlay.svelte";
	import ViewSvgDiagram from "./components/ViewSvgDiagram.svelte";

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
</script>

<div class="view-page">
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
