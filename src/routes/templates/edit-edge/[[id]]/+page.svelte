<script lang="ts">
	import { page } from "$app/stores";
	import html2canvas from "html2canvas";
	import { jsPDF } from "jspdf";
	import edgeCenter from "$lib/assets/edge_center.svg";
	import edgeEnd from "$lib/assets/edge_end.svg";
	import edgeTopSide from "$lib/assets/edge_top_side.svg";
	import rpgSmallLogo from "$lib/assets/rpg_small_logo.png";
	import rpgLogo from "$lib/assets/rpg_logo.svg";

	let { data } = $props();

	// Get the optional id parameter from the URL
	const id = $derived($page.params.id);

	// Determine if we're creating or editing
	const isEditing = $derived(!!id);

	// Reference to the canvas element for PDF generation
	let canvasRef: HTMLDivElement;
	let isGenerating = $state(false);

	// Form state for bottom table inputs
	let quantity = $state('');
	let jobNo = $state('');
	let workOrder = $state('');
	let drawingNo = $state('');
	let dl = $state('');
	let checkedBy = $state('');
	let progBy = $state('');
	let customer = $state('');
	let material = $state('');
	let thickness = $state('');

	// Form state for specifications table inputs
	let centerEdgePlateThickness = $state('');
	let endEdgePlateThickness = $state('');
	let centerEdgeQty = $state('');
	let endEdgeQty = $state('');
	let centerEdgeHoles = $state('');
	let endEdgeHoles = $state('');
	let centerEdgeHoleTypes = $state('');
	let endEdgeHoleTypes = $state('');
	let centerEdgeBevelAngle = $state('');
	let endEdgeBevelAngle = $state('');
	let centerEdgeBevelTopBottom = $state('');
	let endEdgeBevelTopBottom = $state('');
	let centerEdgeSingleDoubleBevel = $state('');
	let endEdgeSingleDoubleBevel = $state('');

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

				<!-- Specifications Table -->
				<div class="table-container table-1">
					<table class="specs-table">
						<thead>
							<tr>
								<th class="label-column"></th>
								<th>CENTRE EDGE</th>
								<th>END EDGE(s)</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> PLATE THICKNESS
									& GRADE</td
								>
								<td><input type="text" bind:value={centerEdgePlateThickness} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgePlateThickness} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> QTY</td
								>
								<td><input type="text" bind:value={centerEdgeQty} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeQty} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> NO. OF HOLES @
									CENTERS</td
								>
								<td><input type="text" bind:value={centerEdgeHoles} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeHoles} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> TYPES OF HOLES</td
								>
								<td><input type="text" bind:value={centerEdgeHoleTypes} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeHoleTypes} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> BEVEL ANGLE &
									TYPE</td
								>
								<td><input type="text" bind:value={centerEdgeBevelAngle} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeBevelAngle} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> BEVEL TOP OR BOTTOM</td
								>
								<td><input type="text" bind:value={centerEdgeBevelTopBottom} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeBevelTopBottom} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label-cell"
									><span class="bullet">•</span> SINGLE OR DOUBLE
									BEVEL</td
								>
								<td><input type="text" bind:value={centerEdgeSingleDoubleBevel} class="table-input" /></td>
								<td><input type="text" bind:value={endEdgeSingleDoubleBevel} class="table-input" /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Bottom Specifications Table -->
				<div class="table-container table-2">
					<table class="bottom-table">
						<tbody>
							<tr>
								<td rowspan="4" class="logo-cell">
									<img
										src={rpgSmallLogo}
										alt="RPG Australia Logo"
										class="rpg-logo"
									/>
								</td>
								<td rowspan="2" class="logo-secondary-cell">
									<img
										src={rpgLogo}
										alt="RPG Logo"
										class="rpg-logo-secondary"
									/>
								</td>
								<td class="label">Quantity:</td>
								<td><input type="number" bind:value={quantity} class="table-input" /></td>
								<td class="label">DL:</td>
								<td><input type="text" bind:value={dl} class="table-input" /></td>
								<td class="label" colspan="4"
									>Part : <span class="edge-template-text"
										>EDGE TEMPLATE</span
									></td
								>
							</tr>
							<tr>
								<td class="label">Job No :</td>
								<td><input type="text" bind:value={jobNo} class="table-input" /></td>
								<td class="label">Checked By:</td>
								<td><input type="text" bind:value={checkedBy} class="table-input" /></td>
								<td class="label" rowspan="2">Customer:</td>
								<td colspan="3" rowspan="2"><input type="text" bind:value={customer} class="table-input" /></td>
							</tr>
							<tr>
								<td rowspan="2" class="address-cell">
									<div class="address-block">
										<p>E: cad@rpg-australia.com.au</p>
										<p>
											36 Industrial Avenue Wacol Qld 4076
										</p>
										<p>
											P: (07) 3723 9000 F: (07) 3721 5542
										</p>
									</div>
								</td>
								<td class="label">W / O #:</td>
								<td><input type="text" bind:value={workOrder} class="table-input" /></td>
								<td class="label">Prog By:</td>
								<td><input type="text" bind:value={progBy} class="table-input" /></td>
							</tr>
							<tr>
								<td class="label">Dwg No.:</td>
								<td colspan="3"><input type="text" bind:value={drawingNo} class="table-input" /></td>
								<td class="label material-label">Material:</td>
								<td class="material-value"><input type="text" bind:value={material} class="table-input" /></td>
								<td class="label thk-label">THK :</td>
								<td class="thk-value"><input type="text" bind:value={thickness} class="table-input" /></td>
							</tr>
						</tbody>
					</table>
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
		/* Fixed A4 landscape dimensions in pixels (at 96 DPI: 297mm = 1122px, 210mm = 793px) */
		width: 1122px;
		height: 793px;
		min-width: 1122px;
		min-height: 793px;
		max-width: 1122px;
		max-height: 793px;
		box-sizing: border-box;
		border: 1px solid #ccc;
		padding: 22px; /* ~0.5cm at 96 DPI */
		background: #fff;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		/* Prevent browser zoom from affecting the canvas */
		transform-origin: top left;
		flex-shrink: 0;
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
		left: 85px;
		width: 750px;
		height: 250px;
	}

	.svg-2 {
		top: 305px;
		left: 105px;
		width: 250px;
		height: 230px;
	}

	.svg-3 {
		top: 63px;
		left: 875px;
		width: 125px;
		height: 212px;
	}

	/* Table container - same positioning system as SVGs */
	.table-container {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Individual table positioning - adjust these values as needed */
	.table-1 {
		top: 318px;
		left: 382px;
		width: 501px;
		height: 200px;
	}

	/* Specifications table styling */
	.specs-table {
		width: 100%;
		height: 100%;
		border-collapse: collapse;
		font-family: "Arial", sans-serif;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.specs-table th,
	.specs-table td {
		border: 1px solid #000;
		padding: 6px 10px;
		text-align: left;
		vertical-align: middle;
	}

	.specs-table thead th {
		font-weight: normal;
		text-align: center;
		background: transparent;
	}

	.specs-table .label-column {
		width: 50%;
		border-top: none;
	}

	.specs-table thead th:first-child {
		border-top: none;
		border-left: none;
	}

	.specs-table .label-cell {
		text-align: left;
		padding-left: 20px;
	}

	.specs-table .bullet {
		margin-right: 15px;
	}

	.specs-table tbody td:not(.label-cell) {
		width: 25%;
		text-align: center;
	}

	.specs-table tbody td:not(.label-cell) {
		width: 25%;
		text-align: center;
	}

	/* Bottom Table Positioning - Adjustable like Table 1 */
	.table-2 {
		top: 644px;
		left: 4px;
		width: 1066px;
		height: 61px;
	}

	.bottom-table {
		width: 100%;
		border-collapse: collapse;
		font-family: "Arial", sans-serif;
		font-size: 11px;
	}

	.bottom-table td {
		border: 1px solid #000;
		padding: 4px 8px;
		vertical-align: middle;
		height: 24px; /* Fixed height for consistency */
	}

	/* Logo Cell Special Styling */
	.logo-cell {
		padding: 0;
		vertical-align: middle !important;
		text-align: center;
		width: 80px;
	}

	.rpg-logo {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 0 auto 8px;
	}

	.logo-secondary-cell {
		padding: 8px;
		vertical-align: middle !important;
		text-align: center;
		width: 125px;
	}

	.rpg-logo-secondary {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 0 auto;
	}

	.address-cell {
		padding: 8px;
		vertical-align: middle !important;
		text-align: center;
		border-left: none !important;
		border-top: none !important;
	}

	/* Border modifications for specific cells */
	.logo-cell {
		border-right: none !important;
	}

	.logo-secondary-cell {
		border-bottom: none !important;
		border-left: none !important;
	}

	.address-block {
		font-size: 7px;
		line-height: 1.2;
		color: #000;
		font-weight: bold;
		text-align: left;
	}

	.address-block p {
		margin: 0;
	}

	/* Table Text Styles */
	.label {
		font-weight: normal;
		white-space: nowrap;
		vertical-align: middle;
		border-right: none !important;
	}

	/* Material and THK specific widths - all equal */
	.material-label,
	.thk-label {
		width: 60px !important;
		min-width: 60px !important;
		max-width: 60px !important;
	}

	.material-value,
	.thk-value {
		width: 80px !important;
		min-width: 80px !important;
		max-width: 80px !important;
	}

	.edge-template-text {
		font-weight: normal;
		margin-right: 20px;
	}

	/* Table Input Styles */
	.table-input {
		width: 100%;
		padding: 2px 4px;
		border: none;
		background: transparent;
		font-family: "Arial", sans-serif;
		font-size: 11px;
		outline: none;
		box-sizing: border-box;
		height: 100%;
	}

	.table-input:focus {
		background: #f0f8ff;
	}
</style>
