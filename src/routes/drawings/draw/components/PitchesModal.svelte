<script lang="ts">
    interface PitchEntry {
        from: number;
        to: number;
        label: string;
    }

    let {
        pitchConfigs = [],
        onClose,
        onSave,
    } = $props<{
        pitchConfigs: PitchEntry[];
        onClose: () => void;
        onSave: (configs: PitchEntry[]) => void;
    }>();

    let localConfigs = $state<PitchEntry[]>([]);

    $effect(() => {
        localConfigs = JSON.parse(JSON.stringify(pitchConfigs));
    });

    function addPitch() {
        localConfigs = [
            ...localConfigs,
            { from: 0, to: 1, label: `P${localConfigs.length + 1}` },
        ];
    }

    function removePitch(index: number) {
        localConfigs = localConfigs.filter((_, i) => i !== index);
    }

    function handleSave() {
        onSave(localConfigs);
        onClose();
    }
</script>

<div
    class="modal-overlay"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <div
        class="modal-container"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="document"
        style="max-width: 500px;"
    >
        <div class="modal-header">
            <h2 class="title-gradient-sm">Manage Pitches</h2>
            <p class="modal-subtitle">Configure pitch distances and labels</p>
            <button
                class="modal-close"
                onclick={onClose}
                aria-label="Close modal"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <div class="modal-body">
            <div class="pitch-list">
                <div class="pitch-header">
                    <span>From</span>
                    <span>To</span>
                    <span>Label</span>
                    <span></span>
                </div>
                {#if localConfigs.length === 0}
                    <div class="empty-state">
                        <p>No pitches configured. Add one to start.</p>
                    </div>
                {/if}
                {#each localConfigs as pitch, index}
                    <div class="pitch-row">
                        <input
                            type="number"
                            class="input-base"
                            bind:value={pitch.from}
                            min="0"
                        />
                        <input
                            type="number"
                            class="input-base"
                            bind:value={pitch.to}
                            min="0"
                        />
                        <input
                            type="text"
                            class="input-base"
                            bind:value={pitch.label}
                            placeholder="Label"
                        />
                        <button
                            class="btn-remove"
                            onclick={() => removePitch(index)}
                            title="Remove Pitch"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>

            <button class="btn-add" onclick={addPitch}>
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Pitch
            </button>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" onclick={onClose}>Cancel</button>
            <button class="btn-primary" onclick={handleSave}
                >Save Changes</button
            >
        </div>
    </div>
</div>

<style>
    .pitch-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
    }

    .pitch-header {
        display: grid;
        grid-template-columns: 80px 80px 1fr 40px;
        gap: var(--spacing-md);
        padding: 0 var(--spacing-sm);
        color: var(--color-gray);
        font-size: var(--font-size-xs);
        font-weight: bold;
        text-transform: uppercase;
    }

    .pitch-row {
        display: grid;
        grid-template-columns: 80px 80px 1fr 40px;
        gap: var(--spacing-md);
        align-items: center;
    }

    .pitch-row input {
        padding: 8px 12px;
        font-size: var(--font-size-sm);
    }

    .btn-remove {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-remove:hover {
        background: #ef4444;
        color: white;
    }

    .btn-add {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        width: 100%;
        padding: var(--spacing-md);
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-lg);
        color: var(--color-gray);
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-add:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-white);
        border-color: var(--color-gold);
    }

    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--color-gray);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-lg);
    }
</style>
