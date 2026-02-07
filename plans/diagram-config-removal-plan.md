# Plan: Remove Diagram Configuration Section

## Objective
Remove the **Diagram Configuration** section from `/src/routes/diagrams/manage/+page.svelte` while keeping the rest of the page functional, including the **Variable Configuration** section.

## Section to Remove
**Lines 422-491** - The "Diagram Configuration" form section containing:
- Dimension JSON editor
- Variables JSON editor (Note: This uses `diagramVariables` which is also used by Variable Configuration section, so it must remain)

## Changes Required

### 1. Template Section (Lines 422-491)
**Remove:**
```svelte
<div class="form-section">
    <h2>Diagram Configuration</h2>
    <!-- Dimension JSON editor -->
    <!-- Variables JSON editor -->
</div>
```

**Keep:**
- `diagramVariables` state variable (used by Variable Configuration section)
- `validateJson()` function (used for variables validation)
- `formatJson()` function (used for variables formatting)

### 2. State Variables to Remove
| Variable | Line | Reason |
|----------|------|--------|
| `diagramDimension` | 23 | Only used by Diagram Configuration section |

### 3. Functions to Remove
| Function | Line | Reason |
|----------|------|--------|
| `validateJson()` | 182-189 | Only used for dimension validation (diagramDimension is removed) |
| `formatJson()` | 191-199 | Only used for dimension formatting (diagramDimension is removed) |

### 4. Code Cleanup in initializeCreateMode()
**Remove lines 231-233:**
```typescript
diagramDimension = template.template_data?.dimension
    ? JSON.stringify(template.template_data.dimension, null, 2)
    : "{}";
```

**Remove lines 244-246:**
```typescript
diagramDimension = "{}";
diagramDimension = "{}";
```

### 5. Code Cleanup in Edit Mode Effect
**Remove lines 144-146:**
```typescript
diagramDimension = diagram.dimension
    ? JSON.stringify(diagram.dimension, null, 2)
    : '{}';
```

### 6. Form Validation Update
**Line 291:** The `validateJson(diagramDimension)` check will be removed since dimension is no longer in the form.

## Code References to Keep Intact
The following will remain unchanged:
- `diagramVariables` state variable
- `EDGE_VARIABLES` constant
- `parsedVariables` derived value
- `updateVariable()` function
- `SearchableSelect` import
- Variable Configuration section (lines 493-511)

## Final Page Structure
After removal, the page will have:
1. Diagram Details section (lines 371-420) - **kept**
2. ~~Diagram Configuration section~~ - **removed**
3. Variable Configuration section (lines 493-511) - **kept**
4. Canvas Component Rendering (lines 513-537) - **kept**
