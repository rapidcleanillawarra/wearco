<script lang="ts">
	import PdfOverlay from "./components/PdfOverlay.svelte";
	import SvgDrawing from "./components/SvgDrawing.svelte";
	import edgePdf from "$lib/assets/edge.pdf";
	import {
		exportPdfWithOverlay,
		mapStateToFieldValues,
	} from "./utils/pdfExport";

	// Shared state for all editable values (source of truth)
	let widthMm = $state(1000);
	let heightMm = $state(500);
	let holeCount = $state(10);
	let holeSizeMm = $state(100);
	let holeSpacingMm = $state(250);
	let totalHoleDistanceMm = $state(500);

	// Additional PDF overlay fields
	let customerName = $state("");
	let orderNumber = $state("");
	let date = $state(new Date().toISOString().split("T")[0]); // Today's date
	let material = $state("");

	// SVG-specific values (internal to drawing, not from PDF)
	let rectWidth = $state(1000);
	let rectHeight = $state(200);
	let holeType = $state("circle");
	let holeSize = $state(20);

	let isExporting = $state(false);
	let exportError = $state<string | null>(null);

	async function handlePrintPdf() {
		isExporting = true;
		exportError = null;

		try {
			const stateValues = {
				widthMm,
				heightMm,
				holeCount,
				holeSizeMm,
				holeSpacingMm,
				totalHoleDistanceMm,
				customerName,
				orderNumber,
				date,
				material,
			};

			const fieldValues = mapStateToFieldValues(stateValues);

			await exportPdfWithOverlay({
				pdfUrl: edgePdf,
				fieldValues,
				filename: `edge-template-${orderNumber || "filled"}.pdf`,
			});
		} catch (err) {
			console.error("Export failed:", err);
			exportError = err instanceof Error ? err.message : "Export failed";
		} finally {
			isExporting = false;
		}
	}
</script>

<main class="editor-container">
	<div class="page-header">
		<h1>Center Edge Drawing</h1>
		<div class="header-actions">
			<button
				class="print-pdf-btn"
				onclick={handlePrintPdf}
				disabled={isExporting}
			>
				{#if isExporting}
					<span class="spinner-small"></span>
					Generating...
				{:else}
					📄 Print PDF
				{/if}
			</button>
			{#if exportError}
				<span class="export-error">{exportError}</span>
			{/if}
		</div>
	</div>

	<!-- PDF Overlay Section -->
	<section class="pdf-section">
		<PdfOverlay
			bind:widthMm
			bind:heightMm
			bind:holeCount
			bind:holeSizeMm
			bind:holeSpacingMm
			bind:totalHoleDistanceMm
			bind:customerName
			bind:orderNumber
			bind:date
			bind:material
			pdfUrl={edgePdf}
		/>
	</section>

	<!-- SVG Drawing Section -->
	<section class="svg-section">
		<SvgDrawing
			bind:rectWidth
			bind:rectHeight
			bind:holeType
			bind:holeCount
			bind:holeSize
			bind:widthMm
			bind:heightMm
			bind:holeSizeMm
			bind:holeSpacingMm
			bind:totalHoleDistanceMm
		/>
	</section>
</main>

<style>
	.editor-container {
		width: 100%;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 20px;
	}

	.page-header h1 {
		color: #1f2937;
		margin: 0;
		font-size: 28px;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.print-pdf-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 15px;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.print-pdf-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
	}

	.print-pdf-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.export-error {
		color: #ef4444;
		font-size: 14px;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
