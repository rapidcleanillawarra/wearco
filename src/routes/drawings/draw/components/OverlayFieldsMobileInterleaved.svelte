<script lang="ts">
	import type { TemplateField } from "../types";
	import type { WearcoDiagram } from "$lib/types/svg_diagram";
	import FullSvgViewer from "./FullSvgViewer.svelte";

	type SectionItem = {
		displayTitle: string;
		fields: TemplateField[];
		diagrams: WearcoDiagram[];
	};

	type PitchConfigItem = {
		from: number;
		to: number;
		prefix: string;
		suffix: string;
	};

	type SvgConfigItem = {
		diagram_id: string;
		pitch_config: Array<PitchConfigItem>;
	};

	let {
		sections = [],
		fieldValues = {},
		onFieldUpdate,
		onFieldBlur,
		svgConfigs = $bindable({ svg_configs: [] }),
	} = $props<{
		sections: Array<SectionItem>;
		fieldValues: Record<string, string>;
		onFieldUpdate: (fieldId: string, value: string) => void;
		onFieldBlur?: (fieldId: string) => void;
		svgConfigs?: {
			svg_configs: Array<SvgConfigItem>;
		};
	}>();

	function handleInput(fieldId: string, event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		onFieldUpdate(fieldId, target.value);
	}

	function formatSectionTitle(title: string): string {
		if (title === "Other") return title;
		return title.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<div class="mobile-overlay">
	{#each sections as { displayTitle, fields: sectionFields, diagrams: sectionDiagrams }}
		<section class="mobile-section">
			<h3 class="section-title">{formatSectionTitle(displayTitle)}</h3>

			{#if sectionFields.length > 0}
				<div class="section-fields">
					{#each sectionFields as field (field.id)}
						<div class="field-row">
							<label for="mobile-{field.id}" class="field-label">{field.label}</label>
							{#if field.type === "textarea"}
								<textarea
									id="mobile-{field.id}"
									value={fieldValues[field.id] ?? ""}
									oninput={(e) => handleInput(field.id, e)}
									onblur={() => onFieldBlur?.(field.id)}
									class="field-input field-textarea"
									placeholder={field.label}
									rows="2"
								></textarea>
							{:else if field.type === "radio"}
								<div class="radio-group-inline" role="group" aria-label={field.label}>
									{#each field.options ?? [] as option (option.value)}
										<label class="radio-label-inline">
											<input
												type="radio"
												name={field.id}
												value={option.value}
												checked={String(fieldValues[field.id] ?? "") === String(option.value)}
												onchange={() => onFieldUpdate(field.id, option.value)}
												onblur={() => onFieldBlur?.(field.id)}
												class="radio-input"
											/>
											<span class="radio-dot"></span>
											<span>{option.label}</span>
										</label>
									{/each}
								</div>
							{:else}
								<input
									type={field.type === "number" ? "number" : "text"}
									id="mobile-{field.id}"
									value={fieldValues[field.id] ?? ""}
									oninput={(e) => handleInput(field.id, e)}
									onblur={() => onFieldBlur?.(field.id)}
									class="field-input"
									placeholder={field.label}
								/>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if sectionDiagrams.length > 0}
				<div
					class="section-diagrams svg-diagrams-container"
					class:single-column={sectionDiagrams.length === 1}
				>
					{#each sectionDiagrams as diagram (diagram.id)}
						<div class="diagram-item">
							<FullSvgViewer
								{diagram}
								{fieldValues}
								{onFieldUpdate}
								bind:svgConfigs
							/>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	.mobile-overlay {
		display: none;
		padding: var(--spacing-md, 1rem);
		gap: var(--spacing-lg, 1.5rem);
	}

	@media (max-width: 768px) {
		.mobile-overlay {
			display: flex;
			flex-direction: column;
		}
	}

	.mobile-section {
		background: var(--gradient-card, rgba(255, 255, 255, 0.05));
		border: var(--border-subtle, 1px solid rgba(255, 255, 255, 0.1));
		border-radius: var(--radius-lg, 0.5rem);
		padding: var(--spacing-md, 1rem);
		box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.2));
	}

	.section-title {
		font-size: var(--font-size-base, 1rem);
		font-weight: var(--font-weight-semibold, 600);
		margin: 0 0 var(--spacing-sm, 0.5rem) 0;
		color: var(--color-white, #f8fafc);
		text-transform: capitalize;
	}

	.section-fields {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md, 1rem);
		margin-bottom: var(--spacing-md, 1rem);
	}

	.section-fields:last-child {
		margin-bottom: 0;
	}

	.section-diagrams {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-lg, 1.5rem);
		align-items: start;
		margin-top: var(--spacing-sm, 0.5rem);
	}

	.section-diagrams.single-column {
		grid-template-columns: 1fr;
	}

	.diagram-item {
		width: 100%;
	}

	.field-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-label {
		font-size: var(--font-size-sm, 0.875rem);
		font-weight: 500;
		color: var(--color-gray, #94a3b8);
	}

	.field-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(71, 85, 105, 0.6);
		border-radius: var(--radius-md, 0.375rem);
		color: var(--color-white, #f8fafc);
		font-size: 1rem;
		box-sizing: border-box;
	}

	.field-input::placeholder {
		color: rgba(148, 163, 184, 0.7);
	}

	.field-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.field-textarea {
		min-height: 4rem;
		resize: vertical;
	}

	.radio-group-inline {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.radio-label-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-white, #f8fafc);
	}

	.radio-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.radio-dot {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid #3b82f6;
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.8);
		flex-shrink: 0;
	}

	.radio-input:checked + .radio-dot {
		background: #3b82f6;
		box-shadow: inset 0 0 0 3px rgba(15, 23, 42, 0.8);
	}
</style>
