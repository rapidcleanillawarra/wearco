<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/stores";

	import { enhance } from "$app/forms";

	import type { Session } from "@supabase/supabase-js";
	import QRCode from "qrcode";
	import { onMount } from "svelte";

	let { children, data } = $props<{
		data: { session: Session | null; pathname: string };
		children: any;
	}>();

	// Navigation items
	const navItems = [
		{ name: "Dashboard", href: "/dashboard" },
		{ name: "Templates", href: "/templates" },
		{ name: "Customers", href: "/customers" },
	];

	// Hide header on login page
	const isLoginPage = $derived(
		data?.pathname === "/" || $page.url.pathname === "/",
	);

	let isMenuOpen = $state(false);

	// Sticky QR Code Logic
	let qrCodeUrl = $state("");
	let showQrFooter = $state(false);
	let localIp = $state("");

	onMount(async () => {
		if (import.meta.env.DEV) {
			try {
				const response = await fetch("/api/local-ip");
				const data = await response.json();
				localIp = data.ip;
				updateQrCode();
			} catch (err) {
				console.error("Failed to fetch local IP", err);
			}
		}
	});

	function updateQrCode() {
		if (!localIp) return;
		const port = window.location.port;
		const protocol = window.location.protocol;
		const path = $page.url.pathname;

		const localUrl = `${protocol}//${localIp}:${port}${path}`;
		QRCode.toDataURL(localUrl)
			.then((url) => {
				qrCodeUrl = url;
				showQrFooter = true;
			})
			.catch((err) => {
				console.error("Failed to generate QR code", err);
			});
	}

	$effect(() => {
		if (import.meta.env.DEV && localIp && $page.url.pathname) {
			updateQrCode();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-layout">
	{#if !isLoginPage}
		<header class="global-header">
			<div class="header-inner">
				<!-- Logo -->
				<a href="/dashboard" class="logo-link">
					<img
						src="https://wearco.com.au/wp-content/uploads/2024/08/logo-1.png"
						alt="Wearco Logo"
						class="logo-img"
					/>
				</a>

				<!-- Desktop Navigation -->
				<nav class="main-nav desktop-only">
					{#each navItems as item}
						<a
							href={item.href}
							class="nav-link"
							class:active={$page.url.pathname.startsWith(
								item.href,
							)}
						>
							{item.name}
						</a>
					{/each}
				</nav>

				<!-- Desktop User Actions -->
				{#if data.session}
					<div class="user-actions desktop-only">
						<a
							href="/profile"
							class="nav-link"
							class:active={$page.url.pathname === "/profile"}
						>
							Profile
						</a>
						<form
							action="/auth/logout"
							method="POST"
							class="logout-form"
						>
							<button type="submit" class="logout-btn">
								Logout
							</button>
						</form>
					</div>
				{/if}

				<!-- Mobile Menu Toggle -->
				<button
					class="mobile-menu-toggle"
					aria-label="Toggle menu"
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class:open={isMenuOpen}
				>
					<span class="hamburger-line"></span>
					<span class="hamburger-line"></span>
					<span class="hamburger-line"></span>
				</button>
			</div>

			<!-- Mobile Navigation Menu -->
			{#if isMenuOpen}
				<div class="mobile-menu">
					<nav class="mobile-nav">
						{#each navItems as item}
							<a
								href={item.href}
								class="mobile-nav-link"
								class:active={$page.url.pathname.startsWith(
									item.href,
								)}
								onclick={() => (isMenuOpen = false)}
							>
								{item.name}
							</a>
						{/each}

						{#if data.session}
							<div class="mobile-user-actions">
								<a
									href="/profile"
									class="mobile-nav-link"
									class:active={$page.url.pathname ===
										"/profile"}
									onclick={() => (isMenuOpen = false)}
								>
									Profile
								</a>
								<form
									action="/auth/logout"
									method="POST"
									class="logout-form full-width"
								>
									<button
										type="submit"
										class="logout-btn full-width"
									>
										Logout
									</button>
								</form>
							</div>
						{/if}
					</nav>
				</div>
			{/if}
		</header>
	{/if}

	<main class="main-content">
		{@render children()}
	</main>

	<!-- Dev Only Sticky QR Footer -->
	{#if showQrFooter && qrCodeUrl}
		<div class="qr-footer">
			<div class="qr-content">
				<img src={qrCodeUrl} alt="Localhost QR Code" class="qr-code" />
				<div class="qr-text">
					<span class="qr-title">Mobile Dev</span>
					<span class="qr-subtitle">Scan to test on device</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Color Theme Variables */
	:root {
		--color-black: #000000;
		--color-gold: #fac211;
		--color-white: #ffffff;
		--color-gray: #aaaaaa;
		--color-dark-gray: #1a1a1a;
	}

	/* Global Reset */
	:global(html, body) {
		margin: 0;
		padding: 0;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* App Layout */
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Global Header */
	.global-header {
		background: var(--color-black);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky;
		top: 0;
		z-index: 1000;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.header-inner {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		height: 70px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* Logo */
	.logo-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		transition: opacity 0.3s ease;
		z-index: 1001; /* Ensure logo is above mobile menu */
	}

	.logo-link:hover {
		opacity: 0.85;
	}

	.logo-img {
		height: 45px;
		width: auto;
		object-fit: contain;
	}

	/* Navigation */
	.main-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-link {
		padding: 0.65rem 1.25rem;
		color: var(--color-gray);
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.nav-link:hover {
		color: var(--color-white);
		background: rgba(255, 255, 255, 0.08);
	}

	.nav-link.active {
		color: var(--color-black);
		background: var(--color-gold);
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(250, 194, 17, 0.3);
	}

	.nav-link.active:hover {
		background: var(--color-gold);
		box-shadow: 0 6px 16px rgba(250, 194, 17, 0.4);
	}

	/* User Actions */
	.user-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
	}

	.logout-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--color-white);
		padding: 0.65rem 1.25rem;
		border-radius: 8px;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--color-white);
	}

	/* Mobile Menu Toggle */
	.mobile-menu-toggle {
		display: none;
		flex-direction: column;
		justify-content: space-between;
		width: 30px;
		height: 20px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		z-index: 1002;
	}

	.hamburger-line {
		width: 100%;
		height: 2px;
		background-color: var(--color-white);
		border-radius: 2px;
		transition: all 0.3s ease;
	}

	/* Mobile Menu Overlay */
	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background-color: var(--color-black);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		animation: slideDown 0.3s ease forwards;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mobile-nav-link {
		color: var(--color-white);
		text-decoration: none;
		font-size: 1.1rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.2s;
	}

	.mobile-nav-link:hover,
	.mobile-nav-link.active {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: var(--color-gold);
		color: var(--color-gold);
	}

	.mobile-user-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 0.5rem;
	}

	.logout-btn.full-width {
		width: 100%;
		text-align: center;
		padding: 0.75rem;
		border: 1px solid var(--color-gold);
		color: var(--color-gold);
	}

	.logout-btn.full-width:hover {
		background-color: var(--color-gold);
		color: var(--color-black);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.header-inner {
			padding: 0 1rem;
			height: 60px;
		}

		.logo-img {
			height: 35px;
		}

		/* Hide Desktop Elements */
		.desktop-only {
			display: none !important;
		}

		/* Show Mobile Elements */
		.mobile-menu-toggle {
			display: flex;
		}

		/* Hamburger Animation */
		.mobile-menu-toggle.open .hamburger-line:nth-child(1) {
			transform: translateY(9px) rotate(45deg);
		}

		.mobile-menu-toggle.open .hamburger-line:nth-child(2) {
			opacity: 0;
		}

		.mobile-menu-toggle.open .hamburger-line:nth-child(3) {
			transform: translateY(-9px) rotate(-45deg);
		}
	}

	/* Main Content */
	.main-content {
		flex: 1;
	}

	/* QR Code Footer - Only visible on wide screens in Dev mode */
	.qr-footer {
		position: fixed;
		bottom: 2rem;
		left: 2rem;
		z-index: 2000; /* High z-index to stay on top */
		background: rgba(20, 20, 20, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.75rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.5s ease-out;
		display: none; /* Hidden by default, shown via media query */
	}

	@media (min-width: 1024px) {
		.qr-footer {
			display: block;
		}
	}

	.qr-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.qr-code {
		width: 60px;
		height: 60px;
		border-radius: 6px;
		background: white;
		padding: 4px;
	}

	.qr-text {
		display: flex;
		flex-direction: column;
	}

	.qr-title {
		color: var(--color-gold);
		font-weight: 700;
		font-size: 0.85rem;
	}

	.qr-subtitle {
		color: var(--color-gray);
		font-size: 0.75rem;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
