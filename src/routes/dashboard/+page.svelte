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
    /* Color Theme Variables */
    :root {
        --color-black: #000000;
        --color-gold: #fac211;
        --color-white: #ffffff;
        --color-gray: #aaaaaa;
        --color-dark-gray: #1a1a1a;
    }

    /* Container */
    .dashboard-container {
        min-height: 100vh;
        background: linear-gradient(
            135deg,
            #0a0a0a 0%,
            #1a1a1a 50%,
            #0f0f0f 100%
        );
        color: var(--color-white);
        padding: 2rem 3rem;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
    }

    /* Header */
    .page-header {
        margin-bottom: 2.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .title-section h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        background: linear-gradient(
            135deg,
            var(--color-white) 0%,
            var(--color-gold) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        color: var(--color-gray);
        margin: 0;
        font-size: 1rem;
    }

    /* Sign Out Button */
    .signout-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: rgba(255, 255, 255, 0.08);
        color: var(--color-gray);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
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
        animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
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
