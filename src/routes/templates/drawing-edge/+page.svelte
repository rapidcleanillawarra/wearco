<script lang="ts">
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgCenterEdgeDrawing from "./components/SvgCenterEdgeDrawing.svelte";
	import SvgEndEdgeDrawing from "./components/SvgEndEdgeDrawing.svelte";
	import edgePdf from "$lib/assets/edge.pdf";

	// Props
	let { data } = $props();
	let template = $derived(data.template);
	let overlayConfig = $derived(template.template_data);

	// Shared state for all editable values (source of truth)
	let centerEdgeWidth = $state(1000);

	let centerEdgeHeight = $state(500);
	let centerEdgeHoleType = $state("circle");
	let centerEdgeHoleCount = $state(10);
	let centerEdgeHoleSize = $state(10);
	let centerEdgePitch = $state(250);
	let centerEdgeTotalHoleDistance = $state(500);
	let centerEdgeHoleLeft = $state(250);
	let centerEdgeHoleRight = $state(250);

	// Additional PDF overlay fields
	let customerName = $state("");
	let orderNumber = $state("");
	let date = $state(new Date().toISOString().split("T")[0]); // Today's date
	let material = $state("");

	// SVG-specific values (internal to drawing, not from PDF)
	let centerEdgeWidthPx = $state(1000);
	let centerEdgeHeightPx = $state(200);
	let centerEdgeHoleSizePx = $state(20);

	// End Edge state values
	let endEdgeWidthPx = $state(300);
	let endEdgeHeightPx = $state(100);
	let endEdgeHoleType = $state("circle");
	let endEdgeHoleCount = $state(4);
	let endEdgeHoleSizePx = $state(20);
	let endEdgeWidth = $state(300);
	let endEdgeHeight = $state(150);
	let endEdgeHoleSize = $state(10);
	let endEdgePitch = $state(60);
	let endEdgeTotalHoleDistance = $state(180);
	let endEdgeHoleLeft = $state(60);
	let endEdgeHoleRight = $state(60);
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
