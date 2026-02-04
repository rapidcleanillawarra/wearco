<script lang="ts">
    import { enhance } from "$app/forms";
    import type { ActionData, PageData } from "./$types";

    let { data, form } = $props<{ data: PageData; form: ActionData }>();

    let loading = $state(false);
</script>

<div class="page-container">
    <div class="header-section">
        <h1>Your Profile</h1>
        <p class="subtitle">Manage your account settings and preferences</p>
    </div>

    {#if form?.message}
        <div
            class="alert"
            class:success={form.success}
            class:error={!form.success}
        >
            {form.message}
        </div>
    {/if}

    <div class="profile-grid">
        <!-- Profile Info -->
        <section class="card">
            <div class="card-header">
                <h2>Profile Information</h2>
                <p>Update your public profile details</p>
            </div>

            <form
                method="POST"
                action="?/updateProfile"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        loading = false;
                        update();
                    };
                }}
            >
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={data.profile.email}
                        disabled
                        class="input-disabled"
                    />
                    <small class="helper-text"
                        >Email address cannot be changed</small
                    >
                </div>

                <div class="form-group">
                    <label for="displayName">Display Name</label>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={data.profile.displayName}
                        placeholder="Enter your display name"
                    />
                </div>

                <div class="form-actions">
                    <button
                        type="submit"
                        class="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </section>

        <!-- Change Password -->
        <section class="card">
            <div class="card-header">
                <h2>Security</h2>
                <p>Update your password to keep your account secure</p>
            </div>

            <form
                method="POST"
                action="?/updatePassword"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        loading = false;
                        update();
                    };
                }}
            >
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter new password"
                        required
                        minlength="6"
                    />
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        required
                        minlength="6"
                    />
                </div>

                <div class="form-actions">
                    <button
                        type="submit"
                        class="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </section>
    </div>
</div>

<style>
    .page-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header-section {
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-black);
        margin: 0 0 0.5rem 0;
    }

    .subtitle {
        color: var(--color-gray);
        font-size: 1.1rem;
        margin: 0;
    }

    .profile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
    }

    .card {
        background: #ffffff;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid #f0f0f0;
    }

    .card-header {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--color-dark-gray);
    }

    .card-header p {
        color: var(--color-gray);
        font-size: 0.9rem;
        margin: 0;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--color-dark-gray);
        font-size: 0.95rem;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
        font-family: inherit;
    }

    input:focus {
        outline: none;
        border-color: var(--color-gold);
        box-shadow: 0 0 0 3px rgba(250, 194, 17, 0.1);
    }

    .input-disabled {
        background-color: #f8fafc;
        color: #64748b;
        cursor: not-allowed;
    }

    .helper-text {
        display: block;
        margin-top: 0.5rem;
        color: var(--color-gray);
        font-size: 0.85rem;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 2rem;
    }

    .btn-primary {
        background: var(--color-black);
        color: var(--color-white);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
        background: #333;
        transform: translateY(-1px);
    }

    .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        font-weight: 500;
    }

    .alert.success {
        background-color: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
    }

    .alert.error {
        background-color: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    @media (max-width: 768px) {
        .profile-grid {
            grid-template-columns: 1fr;
        }

        .page-container {
            padding: 1rem;
        }
    }
</style>
