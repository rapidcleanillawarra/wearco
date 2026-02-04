<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/stores";

	import { enhance } from "$app/forms";
	import type { Session } from "@supabase/supabase-js";

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

				<!-- Navigation -->
				<nav class="main-nav">
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

				<!-- User Actions -->
				{#if data.session}
					<div class="user-actions">
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
							use:enhance
							class="logout-form"
						>
							<button type="submit" class="logout-btn">
								Logout
							</button>
						</form>
					</div>
				{/if}
			</div>
		</header>
	{/if}

	<main class="main-content">
		{@render children()}
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

	/* Main Content */
	.main-content {
		flex: 1;
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

		.nav-link {
			padding: 0.5rem 0.85rem;
			font-size: 0.85rem;
		}

		.user-actions {
			gap: 0.5rem;
		}
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
</style>
