<script lang="ts">
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgCenterEdgeDrawing from "./components/SvgCenterEdgeDrawing.svelte";
	import SvgEndEdgeDrawing from "./components/SvgEndEdgeDrawing.svelte";
	import edgePdf from "$lib/assets/edge.pdf";

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

<main class="editor-container">
	<!-- PDF Overlay Section -->
	<section class="pdf-section">
		<PdfOverlay
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
	<section class="svg-section">
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
	<section class="svg-section">
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

<style>
	.editor-container {
		width: 100%;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.pdf-section,
	.svg-section {
		width: 100%;
	}

	.pdf-section {
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 30px;
	}
</style>
