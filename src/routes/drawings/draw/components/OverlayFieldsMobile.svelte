<script lang="ts">
	import type { TemplateField } from "../types";

	let {
		fields = [],
		fieldValues = {},
		onFieldUpdate,
		onFieldBlur,
	} = $props<{
		fields: TemplateField[];
		fieldValues: Record<string, string>;
		onFieldUpdate: (fieldId: string, value: string) => void;
		onFieldBlur?: (fieldId: string) => void;
	}>();

	const UNCATEGORIZED = "Other";

	/** Parse "sectionTitle#order" → { title, order }. Missing/invalid → uncategorized, order 999 */
	function parseSection(sectionsStr: string | undefined): { title: string; order: number } {
		const s = (sectionsStr ?? "").trim();
		if (!s) return { title: UNCATEGORIZED, order: 999 };
		const idx = s.indexOf("#");
		if (idx === -1) return { title: s || UNCATEGORIZED, order: 0 };
		const title = s.slice(0, idx).trim() || UNCATEGORIZED;
		const order = parseInt(s.slice(idx + 1).trim(), 10);
		return { title, order: Number.isNaN(order) ? 999 : order };
	}

	/** Groups fields by section title, sorted by order. Section titles sorted by first occurrence order. */
	const sectionsWithFields = $derived.by(() => {
		const map = new Map<string, { order: number; fields: TemplateField[] }>();
		const sectionOrder: string[] = [];

		for (const field of fields) {
			const { title, order } = parseSection(field.sections);
			if (!map.has(title)) {
				map.set(title, { order: 999, fields: [] });
				sectionOrder.push(title);
			}
			const entry = map.get(title)!;
			entry.fields.push(field);
			if (title !== UNCATEGORIZED && order < entry.order) entry.order = order;
		}

		// Sort fields within each section by their parsed order
		for (const entry of map.values()) {
			entry.fields.sort((a, b) => {
				const oA = parseSection(a.sections).order;
				const oB = parseSection(b.sections).order;
				return oA - oB;
			});
		}

		// Build result: section title + sorted fields. Sort sections by min order then by appearance.
		const sectionList: { title: string; fields: TemplateField[] }[] = [];
		const seen = new Set<string>();
		const withOrder = sectionOrder.map((title) => ({
			title,
			...map.get(title)!,
		}));
		withOrder.sort((a, b) => a.order - b.order);
		for (const { title } of withOrder) {
			if (seen.has(title)) continue;
			seen.add(title);
			sectionList.push({ title, fields: map.get(title)!.fields });
		}
		return sectionList;
	});

	function handleInput(fieldId: string, event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		onFieldUpdate(fieldId, target.value);
	}

	function formatSectionTitle(title: string): string {
		if (title === UNCATEGORIZED) return title;
		return title.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<div class="mobile-overlay">
	{#each sectionsWithFields as { title, fields: sectionFields }}
		<section class="mobile-section">
			<h3 class="section-title">{formatSectionTitle(title)}</h3>
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
											checked={fieldValues[field.id] === option.value}
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
