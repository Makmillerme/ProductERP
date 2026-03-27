## Field definition sheet — Delete button visibility
- **Was:** `canDelete` required `_count.tabFields === 0`, so the footer Delete **did not render** when the field was placed on any product card tab (looked like a bug).
- **Now:** `showFieldDeleteButton` for `!isCreate && !isSystem`; button always shown but **disabled** when `tabFieldUsage > 0`, with `title` from `fieldDefinitions.deleteDisabledInUse` (`tFormat` + `count`). `handleDelete` early-returns if `tabFields > 0`.
- Locales: `uk.json` / `en.json` + `npm run generate:locales`.
