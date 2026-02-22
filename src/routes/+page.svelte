<script lang="ts">
    import { supabase, signIn } from "$lib/supabase";
    import { goto } from "$app/navigation";

    // Form state
    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let errorMessage = $state("");

    async function handleSubmit(e: Event) {
        e.preventDefault();
        loading = true;
        errorMessage = "";

        try {
            const { data, error } = await signIn(email, password);

            if (error) {
                errorMessage = error.message;
            } else if (data?.session || data?.user) {
                // Use window.location for full page reload to sync cookies with server
                window.location.href = "/dashboard";
            } else {
                errorMessage = "Sign in failed. Please try again.";
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            errorMessage = "An unexpected error occurred. Please try again.";
        } finally {
            loading = false;
        }
    }

    // Check if already logged in
    $effect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                goto("/dashboard");
            }
        });
    });
</script>

<div class="login-container">
    <div class="login-card">
        <!-- Logo Section -->
        <div class="logo-section">
            <img
                src="https://wearco.com.au/wp-content/uploads/2024/08/logo-1.png"
                alt="Wearco Logo"
                class="logo"
            />
        </div>

        <!-- Title -->
        <div class="title-section">
            <h1>Welcome Back</h1>
            <p class="subtitle">Sign in to continue to your dashboard</p>
        </div>

        <!-- Form -->
        <form class="login-form" onsubmit={handleSubmit}>
            <div class="input-group">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                />
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    placeholder="••••••••"
                    required
                    minlength="6"
                    disabled={loading}
                />
            </div>

            {#if errorMessage}
                <div class="message error">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <button type="submit" class="submit-btn" disabled={loading}>
                {#if loading}
                    <span class="spinner"></span>
                    <span>Signing in...</span>
                {:else}
                    <span>Sign In</span>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                {/if}
            </button>
        </form>
    </div>

    <!-- Background decoration -->
    <div class="bg-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
    </div>
</div>

<style>
    /* Login-specific styles - Theme variables from global CSS */

    /* Container */
    .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            #0a0a0a 0%,
            #1a1a1a 50%,
            #0f0f0f 100%
        );
        padding: 2rem;
        position: relative;
        overflow: hidden;
    }

    /* Background Decoration */
    .bg-decoration {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
    }

    .circle {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(
            circle,
            rgba(250, 194, 17, 0.1) 0%,
            transparent 70%
        );
        animation: float 20s ease-in-out infinite;
    }

    .circle-1 {
        width: 600px;
        height: 600px;
        top: -200px;
        right: -200px;
        animation-delay: 0s;
    }

    .circle-2 {
        width: 400px;
        height: 400px;
        bottom: -100px;
        left: -100px;
        animation-delay: -7s;
    }

    .circle-3 {
        width: 300px;
        height: 300px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation-delay: -14s;
    }

    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        33% {
            transform: translate(30px, -30px) scale(1.05);
        }
        66% {
            transform: translate(-20px, 20px) scale(0.95);
        }
    }

    /* Login Card */
    .login-card {
        width: 100%;
        max-width: 420px;
        background: linear-gradient(
            145deg,
            rgba(30, 30, 30, 0.95) 0%,
            rgba(20, 20, 20, 0.98) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 3rem;
        position: relative;
        z-index: 1;
        animation: cardFadeIn 0.6s ease-out;
        box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    @keyframes cardFadeIn {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* Logo Section */
    .logo-section {
        text-align: center;
        margin-bottom: 2rem;
    }

    .logo {
        height: 50px;
        width: auto;
        filter: brightness(1.1);
    }

    /* Title Section */
    .title-section {
        text-align: center;
        margin-bottom: 2rem;
    }

    .title-section h1 {
        font-size: 1.75rem;
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
        font-size: 0.95rem;
    }

    /* Form */
    .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-gray);
    }

    .input-group input {
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: var(--color-white);
        font-size: 1rem;
        transition: all 0.3s ease;
    }

    .input-group input::placeholder {
        color: rgba(170, 170, 170, 0.5);
    }

    .input-group input:focus {
        outline: none;
        border-color: var(--color-gold);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(250, 194, 17, 0.1);
    }

    .input-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Messages */
    .message {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.875rem 1rem;
        border-radius: 10px;
        font-size: 0.875rem;
        animation: messageIn 0.3s ease-out;
    }

    .message svg {
        flex-shrink: 0;
        margin-top: 1px;
    }

    @keyframes messageIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .message.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #fca5a5;
    }

    /* Submit Button */
    .submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, var(--color-gold) 0%, #e5af0e 100%);
        color: var(--color-black);
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(250, 194, 17, 0.3);
        margin-top: 0.5rem;
    }

    .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(250, 194, 17, 0.4);
    }

    .submit-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    /* Spinner */
    .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid transparent;
        border-top-color: var(--color-black);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Responsive */
    @media (max-width: 480px) {
        .login-card {
            padding: 2rem;
            border-radius: 20px;
        }

        .title-section h1 {
            font-size: 1.5rem;
        }
    }
</style>
