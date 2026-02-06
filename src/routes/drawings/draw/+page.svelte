<script lang="ts">
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgGenericDrawing from "./components/SvgGenericDrawing.svelte";
	import { enhance } from "$app/forms";

	// Props
	let { data } = $props();
	let template = $derived(data.template);
	let drawing = $derived(data.drawing);
	let overlayConfig = $derived(template.template_data);
	let svgDiagrams = $derived(data.svgDiagrams || []);
	let pdfUrl = $derived(data.pdfUrl);

	function getInitialFormData(currentData: any) {
		const currentDrawing = currentData.drawing;
		const currentDiagrams = currentData.svgDiagrams;

		// Default "empty" values if no data exists
		const defaultData = {
			width: 0,
			height: 0,
			holeType: "circle",
			holeCount: 0,
			holeSize: 0,
			pitch: 0,
			totalHoleDistance: 0,
			holeLeft: 0,
			holeRight: 0,
			widthPx: 0,
			heightPx: 0,
			holeSizePx: 0,
			rectX: 50,
			rectY: 50,
		};

		function getDiagramData(name: string) {
			// 1. Check existing drawing
			if (currentDrawing && currentDrawing.drawing_data) {
				const savedDiagram = currentDrawing.drawing_data.find(
					(d: any) => d.name === name,
				);
				if (savedDiagram) {
					return { ...defaultData, ...savedDiagram.data };
				}
			}
			// 2. Check template defaults
			if (!currentDiagrams) return defaultData;
			const diagram = currentDiagrams.find((d: any) => d.name === name);
			return diagram ? { ...defaultData, ...diagram.data } : defaultData;
		}

		const savedCenter = getDiagramData("Center Edge");
		const savedEnd = getDiagramData("End Edge");

		return {
			// Center Edge Defaults
			centerEdgeWidth: savedCenter.width,
			centerEdgeHeight: savedCenter.height,
			centerEdgeHoleType: savedCenter.holeType,
			centerEdgeHoleCount: savedCenter.holeCount,
			centerEdgeHoleSize: savedCenter.holeSize,
			centerEdgePitch: savedCenter.pitch,
			centerEdgeTotalHoleDistance: savedCenter.totalHoleDistance,
			centerEdgeHoleLeft: savedCenter.holeLeft,
			centerEdgeHoleRight: savedCenter.holeRight,
			centerEdgeWidthPx: savedCenter.widthPx,
			centerEdgeHeightPx: savedCenter.heightPx,
			centerEdgeHoleSizePx: savedCenter.holeSizePx,
			centerEdgeRectX: savedCenter.rectX || 50,
			centerEdgeRectY: savedCenter.rectY || 50,

			// End Edge Defaults
			endEdgeWidth: savedEnd.width,
			endEdgeHeight: savedEnd.height,
			endEdgeHoleType: savedEnd.holeType,
			endEdgeHoleCount: savedEnd.holeCount,
			endEdgeHoleSize: savedEnd.holeSize,
			endEdgePitch: savedEnd.pitch,
			endEdgeTotalHoleDistance: savedEnd.totalHoleDistance,
			endEdgeHoleLeft: savedEnd.holeLeft,
			endEdgeHoleRight: savedEnd.holeRight,
			endEdgeWidthPx: savedEnd.widthPx,
			endEdgeHeightPx: savedEnd.heightPx,
			endEdgeHoleSizePx: savedEnd.holeSizePx,
			endEdgeRectX: savedEnd.rectX || 50,
			endEdgeRectY: savedEnd.rectY || 50,

			// PDF Overlay Extras
			customerName: currentDrawing?.customer || "",
			orderNumber: currentDrawing?.work_order || "",
			date: new Date().toISOString().split("T")[0],
			material: currentDrawing?.material || "",
		};
	}

	// Initialize state
	let formData = $state(getInitialFormData(data));

	// Update state when data changes (e.g. navigation)
	$effect(() => {
		formData = getInitialFormData(data);
	});

	let isSaving = $state(false);

	function prepareSaveData() {
		// Use the naming convention from the config to map back to the save structure
		// For backward compatibility, we reconstruct the specific objects expected by the server
		// Or update the server to handle generic data.
		// For now, let's keep the server format: Array of { name, data }

		return JSON.stringify([
			{
				name: "Center Edge",
				data: {
					width: formData.centerEdgeWidth,
					height: formData.centerEdgeHeight,
					holeType: formData.centerEdgeHoleType,
					holeCount: formData.centerEdgeHoleCount,
					holeSize: formData.centerEdgeHoleSize,
					pitch: formData.centerEdgePitch,
					totalHoleDistance: formData.centerEdgeTotalHoleDistance,
					holeLeft: formData.centerEdgeHoleLeft,
					holeRight: formData.centerEdgeHoleRight,
					widthPx: formData.centerEdgeWidthPx,
					heightPx: formData.centerEdgeHeightPx,
					holeSizePx: formData.centerEdgeHoleSizePx,
					rectX: formData.centerEdgeRectX,
					rectY: formData.centerEdgeRectY,
				},
			},
			{
				name: "End Edge",
				data: {
					width: formData.endEdgeWidth,
					height: formData.endEdgeHeight,
					holeType: formData.endEdgeHoleType,
					holeCount: formData.endEdgeHoleCount,
					holeSize: formData.endEdgeHoleSize,
					pitch: formData.endEdgePitch,
					totalHoleDistance: formData.endEdgeTotalHoleDistance,
					holeLeft: formData.endEdgeHoleLeft,
					holeRight: formData.endEdgeHoleRight,
					widthPx: formData.endEdgeWidthPx,
					heightPx: formData.endEdgeHeightPx,
					holeSizePx: formData.endEdgeHoleSizePx,
					rectX: formData.endEdgeRectX,
					rectY: formData.endEdgeRectY,
				},
			},
		]);
	}
</script>

<div class="drawing-page-container">
	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-section">
				<h1>{drawing ? "Edit Drawing" : "New Drawing"}</h1>
				<p class="subtitle">
					{drawing
						? `Editing: ${drawing.name}`
						: "Configure your edge drawing parameters and export to PDF"}
				</p>
			</div>
			<div class="header-actions">
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
					{#if drawing}
						<input
							type="hidden"
							name="drawingId"
							value={drawing.id}
						/>
					{/if}
					<input
						type="hidden"
						name="diagrams"
						value={prepareSaveData()}
					/>
					<button class="save-btn" disabled={isSaving}>
						{#if isSaving}
							Saving...
						{:else}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
								></path>
								<polyline points="17 21 17 13 7 13 7 21"
								></polyline>
								<polyline points="7 3 7 8 15 8"></polyline>
							</svg>
							Save Diagrams
						{/if}
					</button>
				</form>
				<a href="/drawings" class="back-btn">
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

	<main class="editor-container">
		<!-- PDF Overlay Section -->
		<section class="section-card pdf-section">
			<div class="section-header">
				<h2>Configuration</h2>
			</div>
			<PdfOverlay
				overlayFieldsConfig={overlayConfig}
				bind:centerEdgeWidth={formData.centerEdgeWidth}
				bind:centerEdgeHeight={formData.centerEdgeHeight}
				bind:centerEdgeHoleCount={formData.centerEdgeHoleCount}
				bind:centerEdgeHoleSize={formData.centerEdgeHoleSize}
				bind:centerEdgeHoleType={formData.centerEdgeHoleType}
				bind:centerEdgePitch={formData.centerEdgePitch}
				bind:centerEdgeTotalHoleDistance={
					formData.centerEdgeTotalHoleDistance
				}
				bind:centerEdgeHoleLeft={formData.centerEdgeHoleLeft}
				bind:centerEdgeHoleRight={formData.centerEdgeHoleRight}
				bind:endEdgeWidth={formData.endEdgeWidth}
				bind:endEdgeHeight={formData.endEdgeHeight}
				bind:endEdgeHoleCount={formData.endEdgeHoleCount}
				bind:endEdgeHoleSize={formData.endEdgeHoleSize}
				bind:endEdgeHoleType={formData.endEdgeHoleType}
				bind:endEdgePitch={formData.endEdgePitch}
				bind:endEdgeTotalHoleDistance={
					formData.endEdgeTotalHoleDistance
				}
				bind:endEdgeHoleLeft={formData.endEdgeHoleLeft}
				bind:endEdgeHoleRight={formData.endEdgeHoleRight}
				bind:customerName={formData.customerName}
				bind:orderNumber={formData.orderNumber}
				bind:date={formData.date}
				bind:material={formData.material}
				{pdfUrl}
			/>
		</section>

		<!-- Dynamic SVG Drawing Sections -->
		{#if template.template_data.drawings}
			{#each template.template_data.drawings as drawing}
				<section class="section-card svg-section">
					<div class="section-header">
						<h2>{drawing.title}</h2>
					</div>
					<SvgGenericDrawing config={drawing} bind:data={formData} />
				</section>
			{/each}
		{:else}
			<!-- Fallback if no drawings configured (or while migrating) -->
			<div class="section-card">
				<p>No drawings configured for this template.</p>
			</div>
		{/if}
	</main>
</div>

<style>
	/* Drawing editor-specific styles - Theme variables and animations from global CSS */

	/* Global Reset is handled in layout, but we ensure container styles here */

	.drawing-page-container {
		min-height: 100vh;
		background: var(--gradient-dark);
		color: var(--color-white);
		padding: var(--spacing-xl) var(--spacing-2xl);
		font-family: var(--font-primary);
	}

	/* Header Styles */
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

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-gray);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.back-btn:hover {
		color: var(--color-white);
		background: rgba(255, 255, 255, 0.1);
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.save-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-gold);
		color: var(--color-black);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Editor Layout */
	.editor-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
		max-width: 1600px; /* Limit width on very large screens */
		margin: 0 auto;
	}

	/* Sections */
	.section-card {
		background: linear-gradient(
			145deg,
			rgba(30, 30, 30, 0.9) 0%,
			rgba(20, 20, 20, 0.95) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.section-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.section-header h2 {
		color: var(--color-white);
		font-size: 1.5rem;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.drawing-page-container {
			padding: 0.5rem; /* Reduced from 1.5rem to maximize width */
		}

		.title-section h1 {
			font-size: 2rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.section-card {
			padding: 0.75rem; /* Reduced from 1.5rem */
		}

		.section-header h2 {
			font-size: 1.25rem;
		}
	}
</style>
