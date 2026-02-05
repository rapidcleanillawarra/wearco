<script lang="ts">
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgCenterEdgeDrawing from "./components/SvgCenterEdgeDrawing.svelte";
	import SvgEndEdgeDrawing from "./components/SvgEndEdgeDrawing.svelte";
	import edgePdf from "$lib/assets/edge.pdf";

	// Props
	import { enhance } from "$app/forms";

	// Props
	let { data } = $props();
	let template = $derived(data.template);
	let overlayConfig = $derived(template.template_data);
	let svgDiagrams = $derived(data.svgDiagrams || []);

	// Helper to find diagram data
	function getDiagramData(name: string, defaultData: any) {
		if (!data.svgDiagrams) return defaultData;
		const diagram = data.svgDiagrams.find((d: any) => d.name === name);
		return diagram ? { ...defaultData, ...diagram.data } : defaultData;
	}

	// Shared state for all editable values (source of truth)
	// Initialize from DB if available
	let centerDefaults = {
		width: 1000,
		height: 500,
		holeType: "circle",
		holeCount: 10,
		holeSize: 10,
		pitch: 250,
		totalHoleDistance: 500,
		holeLeft: 250,
		holeRight: 250,
		widthPx: 1000,
		heightPx: 200,
		holeSizePx: 20,
	};

	let savedCenter = getDiagramData("Center Edge", centerDefaults);

	let centerEdgeWidth = $state(savedCenter.width);
	let centerEdgeHeight = $state(savedCenter.height);
	let centerEdgeHoleType = $state(savedCenter.holeType);
	let centerEdgeHoleCount = $state(savedCenter.holeCount);
	let centerEdgeHoleSize = $state(savedCenter.holeSize);
	let centerEdgePitch = $state(savedCenter.pitch);
	let centerEdgeTotalHoleDistance = $state(savedCenter.totalHoleDistance);
	let centerEdgeHoleLeft = $state(savedCenter.holeLeft);
	let centerEdgeHoleRight = $state(savedCenter.holeRight);

	// Additional PDF overlay fields
	let customerName = $state("");
	let orderNumber = $state("");
	let date = $state(new Date().toISOString().split("T")[0]); // Today's date
	let material = $state("");

	// SVG-specific values (internal to drawing, not from PDF)
	let centerEdgeWidthPx = $state(savedCenter.widthPx);
	let centerEdgeHeightPx = $state(savedCenter.heightPx);
	let centerEdgeHoleSizePx = $state(savedCenter.holeSizePx);

	// End Edge state values
	let endDefaults = {
		width: 300,
		height: 150,
		holeType: "circle",
		holeCount: 4,
		holeSize: 10,
		pitch: 60,
		totalHoleDistance: 180,
		holeLeft: 60,
		holeRight: 60,
		widthPx: 300,
		heightPx: 100,
		holeSizePx: 20,
	};

	let savedEnd = getDiagramData("End Edge", endDefaults);

	let endEdgeWidthPx = $state(savedEnd.widthPx);
	let endEdgeHeightPx = $state(savedEnd.heightPx);
	let endEdgeHoleType = $state(savedEnd.holeType);
	let endEdgeHoleCount = $state(savedEnd.holeCount);
	let endEdgeHoleSizePx = $state(savedEnd.holeSizePx);
	let endEdgeWidth = $state(savedEnd.width);
	let endEdgeHeight = $state(savedEnd.height);
	let endEdgeHoleSize = $state(savedEnd.holeSize);
	let endEdgePitch = $state(savedEnd.pitch);
	let endEdgeTotalHoleDistance = $state(savedEnd.totalHoleDistance);
	let endEdgeHoleLeft = $state(savedEnd.holeLeft);
	let endEdgeHoleRight = $state(savedEnd.holeRight);

	let isSaving = $state(false);

	function prepareSaveData() {
		return JSON.stringify([
			{
				name: "Center Edge",
				data: {
					width: centerEdgeWidth,
					height: centerEdgeHeight,
					holeType: centerEdgeHoleType,
					holeCount: centerEdgeHoleCount,
					holeSize: centerEdgeHoleSize,
					pitch: centerEdgePitch,
					totalHoleDistance: centerEdgeTotalHoleDistance,
					holeLeft: centerEdgeHoleLeft,
					holeRight: centerEdgeHoleRight,
					widthPx: centerEdgeWidthPx,
					heightPx: centerEdgeHeightPx,
					holeSizePx: centerEdgeHoleSizePx,
				},
			},
			{
				name: "End Edge",
				data: {
					width: endEdgeWidth,
					height: endEdgeHeight,
					holeType: endEdgeHoleType,
					holeCount: endEdgeHoleCount,
					holeSize: endEdgeHoleSize,
					pitch: endEdgePitch,
					totalHoleDistance: endEdgeTotalHoleDistance,
					holeLeft: endEdgeHoleLeft,
					holeRight: endEdgeHoleRight,
					widthPx: endEdgeWidthPx,
					heightPx: endEdgeHeightPx,
					holeSizePx: endEdgeHoleSizePx,
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
				<h1>Center & End Edge Diagrams</h1>
				<p class="subtitle">
					Configure your edge drawing parameters and export to PDF
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
				<a href="/templates" class="back-btn">
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
				bind:centerEdgeWidth
				bind:centerEdgeHeight
				bind:centerEdgeHoleCount
				bind:centerEdgeHoleSize
				bind:centerEdgeHoleType
				bind:centerEdgePitch
				bind:centerEdgeTotalHoleDistance
				bind:centerEdgeHoleLeft
				bind:centerEdgeHoleRight
				bind:endEdgeWidth
				bind:endEdgeHeight
				bind:endEdgeHoleCount
				bind:endEdgeHoleSize
				bind:endEdgeHoleType
				bind:endEdgePitch
				bind:endEdgeTotalHoleDistance
				bind:endEdgeHoleLeft
				bind:endEdgeHoleRight
				bind:customerName
				bind:orderNumber
				bind:date
				bind:material
				pdfUrl={edgePdf}
			/>
		</section>

		<!-- SVG Drawing Section -->
		<section class="section-card svg-section">
			<div class="section-header">
				<h2>Center Edge Preview</h2>
			</div>
			<SvgCenterEdgeDrawing
				bind:centerEdgeWidthPx
				bind:centerEdgeHeightPx
				bind:centerEdgeHoleType
				bind:centerEdgeHoleCount
				bind:centerEdgeHoleSizePx
				bind:centerEdgeWidth
				bind:centerEdgeHeight
				bind:centerEdgeHoleSize
				bind:centerEdgePitch
				bind:centerEdgeTotalHoleDistance
				bind:centerEdgeHoleLeft
				bind:centerEdgeHoleRight
			/>
		</section>

		<!-- End Edge SVG Drawing Section -->
		<section class="section-card svg-section">
			<div class="section-header">
				<h2>End Edge Preview</h2>
			</div>
			<SvgEndEdgeDrawing
				bind:endEdgeWidthPx
				bind:endEdgeHeightPx
				bind:endEdgeHoleType
				bind:endEdgeHoleCount
				bind:endEdgeHoleSizePx
				bind:endEdgeWidth
				bind:endEdgeHeight
				bind:endEdgeHoleSize
				bind:endEdgePitch
				bind:endEdgeTotalHoleDistance
				bind:endEdgeHoleLeft
				bind:endEdgeHoleRight
			/>
		</section>
	</main>
</div>

<style>
	/* Color Theme Variables */
	:root {
		--color-black: #000000;
		--color-gold: #fac211;
		--color-white: #ffffff;
		--color-gray: #aaaaaa;
		--color-dark-gray: #1a1a1a;
		--color-light-gray: #f5f5f5;
	}

	/* Global Reset is handled in layout, but we ensure container styles here */

	.drawing-page-container {
		min-height: 100vh;
		background: linear-gradient(
			135deg,
			#0a0a0a 0%,
			#1a1a1a 50%,
			#0f0f0f 100%
		);
		color: var(--color-white);
		padding: 2rem 3rem;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		box-sizing: border-box;
	}

	/* Header Styles */
	.page-header {
		margin-bottom: 2.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.title-section h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(
			135deg,
			var(--color-white) 0%,
			var(--color-gold) 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}

	.subtitle {
		color: var(--color-gray);
		margin: 0;
		font-size: 1rem;
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
