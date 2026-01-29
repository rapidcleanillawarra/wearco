<script lang="ts">
	import edgeCenter from '$lib/assets/edge_center.svg';
	import edgeEnd from '$lib/assets/edge_end.svg';
	import edgeTopSide from '$lib/assets/edge_top_side.svg';

	let { data } = $props();

	function handlePrint() {
		window.print();
	}
</script>

<div class="print-template-page">
	<header class="template-header no-print">
		<nav>
			<a href="/templates">← Back to Templates</a>
		</nav>
		<div class="header-actions">
			<button type="button" on:click={handlePrint}>Print Template</button>
		</div>
	</header>

	<main class="template-main">
		<div class="a4-canvas">
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
	.print-template-page {
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
		padding: 1cm;
		background: #fff;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.content-box {
		width: 100%;
		height: 100%;
		border: 5px double #000;
		box-sizing: border-box;
		position: relative;
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

	/* Individual SVG positioning and sizing - matches edit page */
	.svg-1 {
		top: 10%;
		left: 10%;
		width: 30%;
		height: 30%;
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

	/* Print-specific styles */
	@media print {
		.no-print {
			display: none !important;
		}

		.print-template-page {
			min-height: auto;
		}

		.template-main {
			padding: 0;
			background: #fff;
			overflow: visible;
		}

		.a4-canvas {
			width: 100%;
			height: 100%;
			border: none;
			box-shadow: none;
			margin: 0;
			page-break-after: avoid;
		}

		@page {
			size: A4 landscape;
			margin: 1cm;
		}
	}
</style>