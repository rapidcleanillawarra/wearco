<script lang="ts">
    import { signOut } from "$lib/supabase";
    import { goto } from "$app/navigation";

    let { data } = $props<{ session: any }>();

    async function handleSignOut() {
        await signOut();
        goto("/");
    }
</script>

<div class="dashboard-container">
    <header class="page-header">
        <div class="header-content">
            <div class="title-section">
                <h1>Dashboard</h1>
                <p class="subtitle">
                    Welcome back{data.session?.user?.email
                        ? `, ${data.session.user.email}`
                        : ""}
                </p>
            </div>
            <div class="header-actions">
                <button class="signout-btn" onclick={handleSignOut}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    </header>

    <main class="dashboard-main">
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h2>Your Dashboard</h2>
            <p>
                This is your central hub. Start by exploring templates or
                managing customers.
            </p>
            <div class="quick-actions">
                <a href="/drawings" class="action-card">
                    <span class="action-icon">📐</span>
                    <span class="action-title">Templates</span>
                    <span class="action-desc">Manage drawings</span>
                </a>
                <a href="/customers" class="action-card">
                    <span class="action-icon">👥</span>
                    <span class="action-title">Customers</span>
                    <span class="action-desc">View clients</span>
                </a>
            </div>
        </div>
    </main>
</div>

<style>
    /* Dashboard-specific styles - Theme variables and animations from global CSS */

    /* Container */
    .dashboard-container {
        min-height: 100vh;
        background: var(--gradient-dark);
        color: var(--color-white);
        padding: var(--spacing-xl) var(--spacing-2xl);
        font-family: var(--font-primary);
    }

    /* Header */
    .page-header {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: var(--border-light);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--spacing-lg);
    }

    .title-section h1 {
        font-size: var(--font-size-4xl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--spacing-sm) 0;
        background: var(--gradient-title);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        color: var(--color-gray);
        margin: 0;
        font-size: var(--font-size-base);
    }

    /* Sign Out Button */
    .signout-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 0.75rem 1.25rem;
        background: rgba(255, 255, 255, 0.08);
        color: var(--color-gray);
        border: var(--border-light);
        border-radius: var(--radius-lg);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: var(--transition-normal);
    }

    .signout-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--color-white);
        border-color: rgba(255, 255, 255, 0.2);
    }

    /* Main Content */
    .dashboard-main {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        animation: fadeInUp 0.6s ease-out;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
    }

    .empty-state h2 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.75rem 0;
        color: var(--color-white);
    }

    .empty-state p {
        color: var(--color-gray);
        margin: 0 0 2rem 0;
        font-size: 1rem;
        max-width: 400px;
    }

    /* Quick Actions */
    .quick-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .action-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1.5rem 2rem;
        background: linear-gradient(
            145deg,
            rgba(30, 30, 30, 0.9) 0%,
            rgba(20, 20, 20, 0.95) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 160px;
    }

    .action-card:hover {
        transform: translateY(-4px);
        border-color: var(--color-gold);
        box-shadow: 0 8px 30px rgba(250, 194, 17, 0.15);
    }

    .action-icon {
        font-size: 2rem;
    }

    .action-title {
        font-weight: 600;
        color: var(--color-white);
        font-size: 1rem;
    }

    .action-desc {
        color: var(--color-gray);
        font-size: 0.8rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .dashboard-container {
            padding: 1.5rem;
        }

        .title-section h1 {
            font-size: 2rem;
        }
    }
</style>
