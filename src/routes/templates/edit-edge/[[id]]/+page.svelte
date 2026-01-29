<script lang="ts">
	import { page } from "$app/stores";
	import html2canvas from "html2canvas";
	import { jsPDF } from "jspdf";
	import edgeCenter from "$lib/assets/edge_center.svg";
	import edgeEnd from "$lib/assets/edge_end.svg";
	import edgeTopSide from "$lib/assets/edge_top_side.svg";

	let { data } = $props();

	// Get the optional id parameter from the URL
	const id = $derived($page.params.id);

	// Determine if we're creating or editing
	const isEditing = $derived(!!id);

	// Reference to the canvas element for PDF generation
	let canvasRef: HTMLDivElement;
	let isGenerating = $state(false);

	// A4 dimensions in mm (landscape)
	const A4_WIDTH_MM = 297;
	const A4_HEIGHT_MM = 210;

	// DPI settings for pixel-perfect rendering
	const TARGET_DPI = 300; // Print quality DPI
	const MM_TO_INCH = 25.4;

	async function generatePDF() {
		if (!canvasRef || isGenerating) return;

		isGenerating = true;

		try {
			// Calculate the scale factor for high-resolution rendering
			// At 300 DPI, we need more pixels than screen resolution
			const scaleFactor = TARGET_DPI / 96; // 96 is standard screen DPI

			// Calculate pixel dimensions at target DPI
			const pxWidth = (A4_WIDTH_MM / MM_TO_INCH) * TARGET_DPI;
			const pxHeight = (A4_HEIGHT_MM / MM_TO_INCH) * TARGET_DPI;

			// Generate high-resolution canvas
			const canvas = await html2canvas(canvasRef, {
				scale: scaleFactor,
				useCORS: true,
				allowTaint: true,
				backgroundColor: "#ffffff",
				logging: false,
				// Ensure we capture the exact dimensions
				width: canvasRef.offsetWidth,
				height: canvasRef.offsetHeight,
			});

			// Create PDF in landscape A4
			const pdf = new jsPDF({
				orientation: "landscape",
				unit: "mm",
				format: "a4",
				compress: true,
			});

			// Convert canvas to image data
			const imgData = canvas.toDataURL("image/png", 1.0);

			// Add image to PDF, fitting exactly to A4 dimensions
			pdf.addImage(
				imgData,
				"PNG",
				0,
				0,
				A4_WIDTH_MM,
				A4_HEIGHT_MM,
				undefined,
				"FAST",
			);

			// Generate filename with timestamp
			const timestamp = new Date().toISOString().slice(0, 10);
			const filename = `template-${id || "new"}-${timestamp}.pdf`;

			// Save the PDF
			pdf.save(filename);
		} catch (error) {
			console.error("Error generating PDF:", error);
			alert("Failed to generate PDF. Please try again.");
		} finally {
			isGenerating = false;
		}
	}

	function handlePrint() {
		generatePDF();
	}
</script>

<div class="edit-template-page">
	<header class="template-header">
		<nav>
			<a href="/templates">← Back to Templates</a>
		</nav>
		<div class="header-actions">
			<button type="button"
				>{isEditing ? "Save Changes" : "Create Template"}</button
			>
			{#if isEditing}
				<button type="button">Preview</button>
			{/if}
			<button type="button" onclick={handlePrint} disabled={isGenerating}>
				{isGenerating ? "Generating PDF..." : "Print"}
			</button>
		</div>
	</header>

	<main class="template-main">
		<div class="a4-canvas" bind:this={canvasRef}>
			<div class="content-box">
				<div class="svg-container svg-1">
					<img src={edgeCenter} alt="Cutting Edge" class="svg-item" />
				</div>
				<div class="svg-container svg-2">
					<img src={edgeEnd} alt="End Edge" class="svg-item" />
				</div>
				<div class="svg-container svg-3">
					<img src={edgeTopSide} alt="Top Side" class="svg-item" />
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.edit-template-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.template-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		flex-shrink: 0;
	}

	.template-header nav {
		display: flex;
		align-items: center;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.template-main {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 1rem;
		background: #f5f5f5;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.a4-canvas {
		width: 297mm;
		height: 210mm;
		box-sizing: border-box;
		border: 1px solid #ccc;
		padding: 0.5cm;
		background: #fff;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.content-box {
		width: 100%;
		height: 100%;
		border: 1px solid #000;
		box-sizing: border-box;
		position: relative;
		/* Double line effect: white gap (4px) then inner black line (1px) */
		box-shadow:
			inset 0 0 0 4px #fff,
			inset 0 0 0 5px #000;
	}

	.svg-container {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.svg-item {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* Individual SVG positioning and sizing - adjust these values as needed */
	.svg-1 {
		top: 15px;
		left: 30px;
		width: 800px;
		height: 300px;
	}

	.svg-2 {
		top: 10%;
		right: 10%;
		width: 25%;
		height: 25%;
	}

	.svg-3 {
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
		width: 40%;
		height: 20%;
	}

	:global(body) {
		margin: 0;
	}
</style>
