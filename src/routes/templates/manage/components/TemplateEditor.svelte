<script lang="ts">
    import PdfViewer from "./PdfViewer.svelte";
    import { onMount } from "svelte";

    type Field = {
        id: string;
        type: string;
        label: string;
        fontSize: number;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        textPosition: "left" | "center" | "right";
        targetFieldf?: string;
    };

    let {
        pdfUrl,
        fields = $bindable([]),
        selectedFieldId = $bindable(null),
        templateWidth = 842, // Default A4 landscape
        templateHeight = 595,
    } = $props<{
        pdfUrl: string | null;
        fields: Field[];
        selectedFieldId: string | null;
        templateWidth?: number;
        templateHeight?: number;
    }>();

    let pdfDimensions = $state({ width: 0, height: 0 });
    let isDragging = $state(false);
    let isResizing = $state(false);
    let dragStart = $state({ x: 0, y: 0 });
    let activeResizeHandle = $state<string | null>(null);
    let tempFieldState = $state<Partial<Field> | null>(null); // For smooth updates during drag

    const scaleX = $derived(
        pdfDimensions.width && templateWidth
            ? pdfDimensions.width / templateWidth
            : 1,
    );
    const scaleY = $derived(
        pdfDimensions.height && templateHeight
            ? pdfDimensions.height / templateHeight
            : 1,
    );

    function handleMouseDown(e: MouseEvent, fieldId: string) {
        e.stopPropagation();
        selectedFieldId = fieldId;
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
    }

    function handleResizeStart(e: MouseEvent, fieldId: string, handle: string) {
        e.stopPropagation();
        selectedFieldId = fieldId;
        isResizing = true;
        activeResizeHandle = handle;
        dragStart = { x: e.clientX, y: e.clientY };
    }

    function handleBackgroundClick() {
        selectedFieldId = null;
    }

    function handleMouseMove(e: MouseEvent) {
        if ((!isDragging && !isResizing) || !selectedFieldId) return;

        const fieldIndex = fields.findIndex(
            (f: Field) => f.id === selectedFieldId,
        );
        if (fieldIndex === -1) return;

        const field = fields[fieldIndex];
        const dx = (e.clientX - dragStart.x) / scaleX;
        const dy = (e.clientY - dragStart.y) / scaleY;

        if (isDragging) {
            fields[fieldIndex] = {
                ...field,
                position: {
                    ...field.position,
                    x: field.position.x + dx,
                    y: field.position.y + dy,
                },
            };
        } else if (isResizing) {
            let { x, y, width, height } = field.position;

            if (activeResizeHandle?.includes("e")) width += dx;
            if (activeResizeHandle?.includes("w")) {
                x += dx;
                width -= dx;
            }
            if (activeResizeHandle?.includes("s")) height += dy;
            if (activeResizeHandle?.includes("n")) {
                y += dy;
                height -= dy;
            }

            // Min size constraint
            if (width < 20) width = 20;
            if (height < 20) height = 20;

            fields[fieldIndex] = {
                ...field,
                position: { x, y, width, height },
            };
        }

        dragStart = { x: e.clientX, y: e.clientY };
    }

    function handleMouseUp() {
        isDragging = false;
        isResizing = false;
        activeResizeHandle = null;
    }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="editor-container">
    {#if pdfUrl}
        <PdfViewer url={pdfUrl} bind:pdfDimensions>
            <div
                class="editor-overlay"
                style:width="{pdfDimensions.width}px"
                style:height="{pdfDimensions.height}px"
                onmousedown={handleBackgroundClick}
                role="button"
                tabindex="0"
            >
                {#each fields as field (field.id)}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="field-box"
                        class:selected={selectedFieldId === field.id}
                        style:left="{field.position.x * scaleX}px"
                        style:top="{field.position.y * scaleY}px"
                        style:width="{field.position.width * scaleX}px"
                        style:height="{field.position.height * scaleY}px"
                        onmousedown={(e) => handleMouseDown(e, field.id)}
                    >
                        <span class="field-label" style:font-size="10px"
                            >{field.label || field.id}</span
                        >

                        {#if selectedFieldId === field.id}
                            <div
                                class="resize-handle nw"
                                onmousedown={(e) =>
                                    handleResizeStart(e, field.id, "nw")}
                            ></div>
                            <div
                                class="resize-handle ne"
                                onmousedown={(e) =>
                                    handleResizeStart(e, field.id, "ne")}
                            ></div>
                            <div
                                class="resize-handle sw"
                                onmousedown={(e) =>
                                    handleResizeStart(e, field.id, "sw")}
                            ></div>
                            <div
                                class="resize-handle se"
                                onmousedown={(e) =>
                                    handleResizeStart(e, field.id, "se")}
                            ></div>
                        {/if}
                    </div>
                {/each}
            </div>
        </PdfViewer>
    {:else}
        <div class="empty-state">
            <p>No Visual Document selected.</p>
        </div>
    {/if}
</div>

<style>
    .editor-container {
        position: relative;
        width: 100%;
        height: 100%;
        background: #f1f5f9;
        overflow: auto;
    }

    .editor-overlay {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10;
        pointer-events: auto;
    }

    .field-box {
        position: absolute;
        border: 1px solid rgba(59, 130, 246, 0.6);
        background: rgba(59, 130, 246, 0.1);
        cursor: move;
        user-select: none;
        box-sizing: border-box;
    }

    .field-box.selected {
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.2);
        z-index: 20;
    }

    .field-label {
        position: absolute;
        top: -16px;
        left: 0;
        background: #3b82f6;
        color: white;
        padding: 0 4px;
        border-radius: 2px;
        font-size: 10px;
        white-space: nowrap;
        pointer-events: none;
    }

    .resize-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: white;
        border: 1px solid #3b82f6;
        border-radius: 50%;
    }

    .nw {
        top: -4px;
        left: -4px;
        cursor: nw-resize;
    }
    .ne {
        top: -4px;
        right: -4px;
        cursor: ne-resize;
    }
    .sw {
        bottom: -4px;
        left: -4px;
        cursor: sw-resize;
    }
    .se {
        bottom: -4px;
        right: -4px;
        cursor: se-resize;
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #64748b;
    }
</style>
