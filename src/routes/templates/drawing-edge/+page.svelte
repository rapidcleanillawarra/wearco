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
	let svgWidth = $state(600);
	const svgHeight = 400;

	// Zoom functionality
	let zoomLevel = $state(1);
	const MIN_ZOOM = 0.1;
	const MAX_ZOOM = 5;
	const ZOOM_STEP = 0.1;

	// Conversion factor: pixels to mm (approximately 3.78 pixels per mm at 96 DPI)
	// Using 1:1 for simplicity as per original
	const PIXELS_TO_MM = 0.5;

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
		// Adjust coordinates for zoom
		dragStart = {
			x: (event.clientX - rect.left) / zoomLevel - rectX,
			y: (event.clientY - rect.top) / zoomLevel - rectY,
		};
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();

		const mouseX = (event.clientX - rect.left) / zoomLevel;
		const mouseY = (event.clientY - rect.top) / zoomLevel;

		const newX = mouseX - dragStart.x;
		const newY = mouseY - dragStart.y;

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
		const svg = (event.currentTarget as Element).closest(
			"svg",
		) as SVGSVGElement;
		const rect = svg.getBoundingClientRect();

		dragStart = {
			x: (event.clientX - rect.left) / zoomLevel,
			y: (event.clientY - rect.top) / zoomLevel,
		};
	}

	function handleResizeMouseMove(event: MouseEvent) {
		if (!isResizing) return;

		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();

		const currentX = (event.clientX - rect.left) / zoomLevel;
		const currentY = (event.clientY - rect.top) / zoomLevel;

		const deltaX = currentX - dragStart.x;
		const deltaY = currentY - dragStart.y;

		const newWidth = Math.max(10, resizeStart.width + deltaX);
		const newHeight = Math.max(10, resizeStart.height + deltaY);

		rectWidth = newWidth;
		rectHeight = newHeight;
	}
</script>

<main class="editor-container">
	<div class="header-section">
		<h1>SVG Rectangle Editor</h1>

		<div class="editor-controls">
			<div class="control-panel">
				<div class="dimension-section">
					<h3>Dimensions</h3>
					<div class="input-row">
						<div class="control-group">
							<label for="width-input">W:</label>
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
							<label for="height-input">H:</label>
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

						<div class="control-group separator">
							<label for="width-mm-input">W:</label>
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

						<div class="control-group">
							<label for="height-mm-input">H:</label>
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
						<button
							onclick={zoomOut}
							disabled={zoomLevel <= MIN_ZOOM}
							class="zoom-btn">-</button
						>
						<span class="zoom-level"
							>{Math.round(zoomLevel * 100)}%</span
						>
						<button
							onclick={zoomIn}
							disabled={zoomLevel >= MAX_ZOOM}
							class="zoom-btn">+</button
						>
						<button onclick={resetZoom} class="zoom-btn reset"
							>Reset</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Bind container clientWidth to svgWidth state -->
	<div class="svg-container" bind:clientWidth={svgWidth}>
		<div
			class="svg-wrapper"
			style="transform: scale({zoomLevel}); transform-origin: top left; width: 100%; height: 100%;"
		>
			<!-- Use dynamic svgWidth -->
			<svg
				width={svgWidth}
				height={svgHeight}
				viewBox="0 0 {svgWidth} {svgHeight}"
				class="svg-canvas"
				onmousedown={handleMouseDown}
				onmousemove={(e) => {
					handleMouseMove(e);
					handleResizeMouseMove(e);
				}}
				onmouseup={handleMouseUp}
				onmouseleave={handleMouseUp}
				onwheel={handleWheelZoom}
			>
				<!-- Grid background for better positioning -->
				<defs>
					<pattern
						id="grid"
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M 20 0 L 0 0 0 20"
							fill="none"
							stroke="#e0e0e0"
							stroke-width="1"
						/>
					</pattern>
					<marker
						id="arrow-start"
						viewBox="0 0 10 10"
						refX="5"
						refY="5"
						markerWidth="6"
						markerHeight="6"
						orient="auto"
					>
						<path d="M 10 0 L 0 5 L 10 10 z" fill="#374151" />
					</marker>
					<marker
						id="arrow-end"
						viewBox="0 0 10 10"
						refX="5"
						refY="5"
						markerWidth="6"
						markerHeight="6"
						orient="auto"
					>
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
					</marker>
				</defs>
				<rect width="100%" height="100%" fill="url(#grid)" />

				<!-- Height Dimension -->
				<g class="dimension-line">
					<line
						x1={rectX - 20}
						y1={rectY}
						x2={rectX - 20}
						y2={rectY + rectHeight}
						stroke="#374151"
						stroke-width="1.5"
						marker-start="url(#arrow-start)"
						marker-end="url(#arrow-end)"
					/>
					<text
						x={rectX - 35}
						y={rectY + rectHeight / 2}
						fill="#374151"
						font-size="12"
						text-anchor="middle"
						transform="rotate(-90, {rectX - 35}, {rectY +
							rectHeight / 2})"
					>
						{getHeightMm()} mm
					</text>
				</g>

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
				<text
					x={rectX + 5}
					y={rectY + 20}
					fill="white"
					font-size="12"
					font-weight="bold"
				>
					({Math.round(rectX)}, {Math.round(rectY)})
				</text>
			</svg>
		</div>
	</div>

	<div class="info-panel">
		<p>
			<strong>Position:</strong> ({Math.round(rectX)}, {Math.round(
				rectY,
			)}) pixels
		</p>
		<p>
			<strong>Size:</strong>
			{rectWidth} × {rectHeight} pixels ({getWidthMm()} × {getHeightMm()} mm)
		</p>
		<p><strong>Zoom:</strong> {Math.round(zoomLevel * 100)}%</p>
		<p>
			<strong>Instructions:</strong> Click and drag the rectangle to move it
			around. Use the pixel or millimeter input fields above to adjust width
			and height. Use zoom controls or mouse wheel to zoom in/out.
		</p>
	</div>
</main>

<style>
	.editor-container {
		width: 100%;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 20px;
		flex-wrap: wrap;
		gap: 20px;
	}

	h1 {
		color: #1f2937;
		margin: 0;
		font-size: 24px;
	}

	.editor-controls {
		display: flex;
		align-items: center;
	}

	.control-panel {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.dimension-section,
	.zoom-controls {
		background: #f9fafb;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.dimension-section h3,
	.zoom-controls h3 {
		margin: 0;
		color: #1f2937;
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
	}

	.zoom-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.zoom-btn {
		width: 32px;
		height: 32px;
		border: 2px solid #d1d5db;
		background: white;
		border-radius: 6px;
		font-size: 16px;
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
		padding: 0 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.zoom-level {
		font-weight: 600;
		color: #1f2937;
		min-width: 50px;
		text-align: center;
		font-size: 14px;
	}

	.input-row {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.control-group.separator {
		border-left: 1px solid #d1d5db;
		padding-left: 16px;
	}

	label {
		font-weight: 500;
		color: #374151;
		font-size: 14px;
	}

	input {
		width: 60px;
		padding: 6px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 13px;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
	}

	span {
		color: #6b7280;
		font-size: 12px;
	}

	.svg-container {
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden; /* Important so SVG doesn't overflow */
		background: white;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
		flex: 1; /* Consume remaining height */
		position: relative;
	}

	.svg-wrapper {
		transform-origin: top left;
		width: 100%;
		height: 100%;
		/* removed overflow hidden to allow scaling */
	}

	.svg-canvas {
		cursor: move;
		display: block;
		background-color: #ffffff;
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
		padding: 12px 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.info-panel p {
		margin: 4px 0;
		color: #374151;
		font-size: 13px;
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
