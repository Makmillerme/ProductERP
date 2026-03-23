# System Tab "Головна" (Main)

## Architecture (like Admin/Owner pattern)
- **Config in code:** `src/config/system-tab.ts` — SYSTEM_TAB_CONFIG (nameI18nKey, dbName, order, isSystem)
- **DB record created in 2 places only:**
  1. `POST /api/admin/categories` — in $transaction when creating a category
  2. `prisma/seed-product-cms.ts` — iterates categories, creates if missing
- **NO ensureSystemTab on every GET** — removed from all read endpoints
- `src/lib/system-tab.ts` — DELETED (was hacky per-request check)

## DB Schema
- `tab_definitions.is_system` BOOLEAN DEFAULT false — added in migration `20260311120000_add_tab_is_system`

## Migrations
- `20260311120000_add_tab_is_system` — adds `is_system` column + creates Головна for categories without tabs
- `20260323120000_default_tab_golovna` — clears all tabs (test data)
- `20260323120100_tabs_from_code_only` — clears all tabs again (code-first)

## Protection
- `DELETE /api/admin/tabs/[id]` — returns 400 if `tab.isSystem`
- UI: delete button hidden for system tabs

## i18n
- uk: `productsConfig.tabsConfig.defaultTabName` = "Головна"
- en: `productsConfig.tabsConfig.defaultTabName` = "Main"

## UI display
- `tabs-config-management.tsx` — shows `t(SYSTEM_TAB_CONFIG.nameI18nKey)` for system tabs
- `product-detail-sheet.tsx` — shows `t(SYSTEM_TAB_CONFIG.nameI18nKey)` for system tab triggers

## Type support
- `TabDefinitionItem.isSystem?: boolean` (products-config/types.ts)
- `ProductConfigTab.isSystem?: boolean` (use-product-config.ts)