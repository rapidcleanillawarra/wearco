<script lang="ts">
	// Rectangle properties
	let rectWidth = $state(200);
	let rectHeight = $state(100);
	let rectX = $state(50);
	let rectY = $state(50);
	let isDragging = $state(false);
	let isResizing = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let resizeStart = $state({ width: 0, height: 0 });

	// SVG canvas dimensions
	const svgWidth = 600;
	const svgHeight = 400;

	// Zoom functionality
	let zoomLevel = $state(1);
	const MIN_ZOOM = 0.1;
	const MAX_ZOOM = 5;
	const ZOOM_STEP = 0.1;

	// Conversion factor: pixels to mm (approximately 3.78 pixels per mm at 96 DPI)
	const PIXELS_TO_MM = 3.78;

	// Computed mm values
	$effect(() => {
		// This effect runs when rectWidth or rectHeight changes
	});

	function getWidthMm(): number {
		return Math.round(rectWidth / PIXELS_TO_MM);
	}

	function getHeightMm(): number {
		return Math.round(rectHeight / PIXELS_TO_MM);
	}

	function handleWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value > 0) {
			rectWidth = value;
		}
	}

	function handleHeightChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value > 0) {
			rectHeight = value;
		}
	}

	function handleWidthMmChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value > 0 && value <= 9999) {
			rectWidth = Math.round(value * PIXELS_TO_MM);
		}
	}

	function handleHeightMmChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value > 0 && value <= 9999) {
			rectHeight = Math.round(value * PIXELS_TO_MM);
		}
	}

	function zoomIn() {
		zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
	}

	function zoomOut() {
		zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
	}

	function resetZoom() {
		zoomLevel = 1;
	}

	function handleWheelZoom(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		dragStart = {
			x: event.clientX - rect.left - rectX,
			y: event.clientY - rect.top - rectY
		};
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const newX = event.clientX - rect.left - dragStart.x;
		const newY = event.clientY - rect.top - dragStart.y;

		// Keep rectangle within bounds
		rectX = Math.max(0, Math.min(newX, svgWidth - rectWidth));
		rectY = Math.max(0, Math.min(newY, svgHeight - rectHeight));
	}

	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
	}

	function handleResizeMouseDown(event: MouseEvent) {
		event.stopPropagation(); // Prevent triggering drag
		isResizing = true;
		resizeStart = { width: rectWidth, height: rectHeight };
		const svg = (event.currentTarget as Element).closest('svg') as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		dragStart = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function handleResizeMouseMove(event: MouseEvent) {
		if (!isResizing) return;

		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const currentX = event.clientX - rect.left;
		const currentY = event.clientY - rect.top;

		const deltaX = currentX - dragStart.x;
		const deltaY = currentY - dragStart.y;

		const newWidth = Math.max(10, resizeStart.width + deltaX);
		const newHeight = Math.max(10, resizeStart.height + deltaY);

		rectWidth = newWidth;
		rectHeight = newHeight;
	}
</script>

<main class="editor-container">
	<h1>SVG Rectangle Editor</h1>

	<div class="editor-controls">
		<div class="dimension-section">
			<h3>Dimensions</h3>
			<div class="input-row">
				<div class="control-group">
					<label for="width-input">Width:</label>
					<input
						id="width-input"
						type="number"
						min="10"
						max="500"
						value={rectWidth}
						onchange={handleWidthChange}
					/>
					<span>px</span>
				</div>

				<div class="control-group">
					<label for="width-mm-input">Width:</label>
					<input
						id="width-mm-input"
						type="number"
						min="1"
						max="9999"
						value={getWidthMm()}
						onchange={handleWidthMmChange}
					/>
					<span>mm</span>
				</div>
			</div>

			<div class="input-row">
				<div class="control-group">
					<label for="height-input">Height:</label>
					<input
						id="height-input"
						type="number"
						min="10"
						max="300"
						value={rectHeight}
						onchange={handleHeightChange}
					/>
					<span>px</span>
				</div>

				<div class="control-group">
					<label for="height-mm-input">Height:</label>
					<input
						id="height-mm-input"
						type="number"
						min="1"
						max="9999"
						value={getHeightMm()}
						onchange={handleHeightMmChange}
					/>
					<span>mm</span>
				</div>
			</div>
		</div>

		<div class="zoom-controls">
			<h3>Zoom</h3>
			<div class="zoom-buttons">
				<button onclick={zoomOut} disabled={zoomLevel <= MIN_ZOOM} class="zoom-btn">-</button>
				<span class="zoom-level">{Math.round(zoomLevel * 100)}%</span>
				<button onclick={zoomIn} disabled={zoomLevel >= MAX_ZOOM} class="zoom-btn">+</button>
				<button onclick={resetZoom} class="zoom-btn reset">Reset</button>
			</div>
		</div>
	</div>

	<div class="svg-container">
		<div class="svg-wrapper" style="transform: scale({zoomLevel}); transform-origin: center;">
			<svg
				width={svgWidth}
				height={svgHeight}
				viewBox="0 0 {svgWidth} {svgHeight}"
				class="svg-canvas"
				onmousedown={handleMouseDown}
				onmousemove={(e) => { handleMouseMove(e); handleResizeMouseMove(e); }}
				onmouseup={handleMouseUp}
				onmouseleave={handleMouseUp}
				onwheel={handleWheelZoom}
			>
			<!-- Grid background for better positioning -->
			<defs>
				<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
					<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />

			<!-- Main rectangle -->
			<rect
				x={rectX}
				y={rectY}
				width={rectWidth}
				height={rectHeight}
				fill="#4f46e5"
				stroke="#1e1b4b"
				stroke-width="2"
				rx="4"
				class="rectangle"
			/>

			<!-- Resize handles -->
			<circle
				cx={rectX + rectWidth}
				cy={rectY + rectHeight}
				r="6"
				fill="#ef4444"
				class="resize-handle"
				onmousedown={handleResizeMouseDown}
			/>

			<!-- Position indicator -->
			<text x={rectX + 5} y={rectY + 20} fill="white" font-size="12" font-weight="bold">
				({rectX}, {rectY})
			</text>
		</svg>
		</div>
	</div>

	<div class="info-panel">
		<p><strong>Position:</strong> ({rectX}, {rectY}) pixels</p>
		<p><strong>Size:</strong> {rectWidth} × {rectHeight} pixels ({getWidthMm()} × {getHeightMm()} mm)</p>
		<p><strong>Zoom:</strong> {Math.round(zoomLevel * 100)}%</p>
		<p><strong>Instructions:</strong> Click and drag the rectangle to move it around. Use the pixel or millimeter input fields above to adjust width and height. Use zoom controls or mouse wheel to zoom in/out.</p>
	</div>
</main>

<style>
	.editor-container {
		width: 100%;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		color: #1f2937;
		margin-bottom: 30px;
		text-align: center;
	}

	.editor-controls {
		margin-bottom: 20px;
	}

	.dimension-section {
		background: #f9fafb;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.dimension-section h3 {
		margin: 0 0 12px 0;
		color: #1f2937;
		font-size: 16px;
		font-weight: 600;
	}

	.zoom-controls {
		background: #f9fafb;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		margin-top: 16px;
	}

	.zoom-controls h3 {
		margin: 0 0 12px 0;
		color: #1f2937;
		font-size: 16px;
		font-weight: 600;
	}

	.zoom-buttons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.zoom-btn {
		width: 40px;
		height: 40px;
		border: 2px solid #d1d5db;
		background: white;
		border-radius: 6px;
		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zoom-btn:hover:not(:disabled) {
		border-color: #4f46e5;
		background: #4f46e5;
		color: white;
	}

	.zoom-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.zoom-btn.reset {
		width: auto;
		padding: 0 16px;
		font-size: 14px;
		font-weight: normal;
	}

	.zoom-level {
		font-weight: 600;
		color: #1f2937;
		min-width: 60px;
		text-align: center;
		font-size: 16px;
	}

	.input-row {
		display: flex;
		gap: 20px;
		margin-bottom: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.input-row:last-child {
		margin-bottom: 0;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	label {
		font-weight: 500;
		color: #374151;
		min-width: 60px;
	}

	input {
		width: 90px;
		padding: 8px 12px;
		border: 2px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}

	span {
		color: #6b7280;
		font-size: 14px;
	}

	.svg-container {
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		background: white;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 420px;
	}

	.svg-wrapper {
		transition: transform 0.1s ease-out;
	}

	.svg-canvas {
		cursor: move;
		display: block;
	}

	.svg-canvas:hover .rectangle {
		stroke-width: 3;
	}

	.rectangle {
		transition: stroke-width 0.2s;
		cursor: move;
	}

	.rectangle:hover {
		fill: #6366f1;
	}

	.resize-handle {
		cursor: nw-resize;
		opacity: 0.8;
	}

	.resize-handle:hover {
		opacity: 1;
		r: 8;
	}

	.info-panel {
		background: #f9fafb;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.info-panel p {
		margin: 8px 0;
		color: #374151;
		font-size: 14px;
	}

	.info-panel p:first-child {
		margin-top: 0;
	}

	.info-panel p:last-child {
		margin-bottom: 0;
		font-style: italic;
		color: #6b7280;
	}
</style>