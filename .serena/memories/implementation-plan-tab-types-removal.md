# Implementation Plan: Remove Tab Types — Tabs as Pages Only

**Date:** 2026-03-04  
**Scope:** Remove tab types (gallery, documents, fields). Tab = page. Content = blocks of fields.

---

## 1. Current State Analysis

### 1.1 TabDefinition (Prisma)

| Field    | Type   | Default | Usage |
|----------|--------|---------|-------|
| tabType  | String | "fields" | Drives DynamicTabs rendering: gallery → full media UI, documents → VehicleDocumentsTab, fields → DynamicFieldRenderer |
| tabConfig| String? | null | JSON for document folders when tabType=documents |

**Schema:** `prisma/schema.prisma` lines 272–289

### 1.2 DynamicTabs (vehicle-detail-sheet.tsx)

| tabType | Rendering |
|---------|-----------|
| `gallery` | VehicleMediaUploader + VehicleMediaGallery (full width) |
| `documents` | VehicleDocumentsTab with folders from tabConfig |
| `fields` | Grid of DynamicFieldRenderer for each tab.fields |

**Lines:** 163–241

### 1.3 FieldDefinition (widgetType)

10 types already supported in `field-definitions-management.tsx`:

- `text_input` — Regular input (text, number, currency via dataType)
- `media_gallery` — DynamicFieldRenderer already handles
- `file_upload` — DynamicFieldRenderer already handles (uses documentFolders from tabConfig)
- `select`, `multiselect`, `radio` — Select/dropdown
- `calculated` — Formula
- `composite` — Dimensions (height, length, width)
- `textarea` — Notes
- `datepicker` — Date picker

**Note:** DynamicFieldRenderer also checks `number_input`, `currency_input` — legacy. Consolidate to `text_input` + dataType.

### 1.4 Files Affected

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | TabDefinition.tabType, tabConfig |
| `src/features/vehicles/components/vehicle-detail-sheet.tsx` | DynamicTabs tabType switch |
| `src/features/vehicles/hooks/use-vehicle-config.ts` | VehicleConfigTab.tabType |
| `src/features/management/components/vehicles-config/tabs-config-management.tsx` | tabType selector, tabConfig UI |
| `src/features/management/components/vehicles-config/types.ts` | TabDefinitionItem.tabType |
| `src/app/api/admin/categories/[id]/tabs/route.ts` | POST body tabType |
| `src/app/api/vehicle-config/[vehicleTypeId]/route.ts` | Returns tabs with tabType |

---

## 2. Target Architecture

### 2.1 Tab Content Model

- **Tab** = page only (name, code, icon, order).
- **Tab content** = ordered list of `TabField` (blocks).
- Each block has `FieldDefinition` with `widgetType`.

### 2.2 Field Types → Widget Behavior

| # | Type | widgetType | Notes |
|---|------|------------|-------|
| 1 | Regular input | text_input | dataType: string, integer, float, currency |
| 2 | Media gallery | media_gallery | VehicleMediaUploader + VehicleMediaGallery |
| 3 | File uploader | file_upload | VehicleDocumentsTab; folders from field presetValues |
| 4 | Dropdown | select | presetValues |
| 5 | Checkbox | multiselect | presetValues |
| 6 | Radio | radio | presetValues |
| 7 | Calculated | calculated | validation = formula {slug1}+{slug2} |
| 8 | Composite | composite | presetValues: subfields |
| 9 | Textarea | textarea | Notes |
| 10 | Date picker | datepicker | |

### 2.3 file_upload Folder Config

**Current:** tabConfig on tab → parseDocumentFoldersFromTabConfig → passed to DynamicFieldRenderer.

**Target:** field.presetValues as JSON: `{"folders":[{"code":"x","label":"y"}]}`. DynamicFieldRenderer reads from fieldDefinition.presetValues for file_upload.

**Fallback:** If presetValues empty, show empty folder list or placeholder.

### 2.4 tabConfig Migration

- **Option A:** Remove tabConfig column (breaking for existing documents tabs).
- **Option B:** Keep tabConfig for backward compat; during migration, copy tabConfig → presetValues of first file_upload field in that tab.
- **Recommended:** Keep tabConfig nullable during transition; deprecate after migration. file_upload field can fall back to tab.tabConfig if no presetValues.

---

## 3. Step-by-Step Implementation Plan

### Phase 1: Database Migration

**Step 1.1 — Prisma migration**

- Create migration to drop `tab_type` column from `tab_definitions`.
- Option: keep `tab_config` column for backward compat (nullable, deprecated).

```sql
-- Migration: remove_tab_type
ALTER TABLE "tab_definitions" DROP COLUMN IF EXISTS "tab_type";
-- tab_config stays for now (optional)
```

**Step 1.2 — Update Prisma schema**

- Remove `tabType` from `TabDefinition` model.
- Keep `tabConfig` optional (nullable).

**Files:** `prisma/schema.prisma`, `prisma/migrations/YYYYMMDD_remove_tab_type/migration.sql`

---

### Phase 2: API / Backend

**Step 2.1 — Categories tabs API**

- Remove `tabType` from POST body.
- Remove `tabType` from `create` data.
- Keep `tabConfig` in create/update for backward compat.

**File:** `src/app/api/admin/categories/[id]/tabs/route.ts`

**Step 2.2 — Tabs PATCH API**

- No change needed (PATCH does not send tabType).
- Ensure `tabConfig` remains optional.

**File:** `src/app/api/admin/tabs/[id]/route.ts`

**Step 2.3 — Vehicle config API**

- Response still returns `tabConfig` (for file_upload fallback).
- Remove `tabType` from serialized tab object if present.

**File:** `src/app/api/vehicle-config/[vehicleTypeId]/route.ts`

---

### Phase 3: Types and Hooks

**Step 3.1 — VehicleConfigTab type**

- Remove `tabType` from `VehicleConfigTab`.

**File:** `src/features/vehicles/hooks/use-vehicle-config.ts`

**Step 3.2 — TabDefinitionItem type**

- Remove `tabType` from `TabDefinitionItem`.

**File:** `src/features/management/components/vehicles-config/types.ts`

---

### Phase 4: Admin UI — Tabs Config Management

**Step 4.1 — Remove tab type selector**

- Remove `tabType` state and Select UI.
- Remove conditional rendering for tabType (documents tabConfig, fields section).

**Step 4.2 — Always show field assignment**

- All tabs use field blocks.
- Remove `tabType === "fields"` condition; always show "Призначені поля".

**Step 4.3 — tabConfig handling**

- **Option A:** Remove tabConfig UI entirely; file_upload uses presetValues.
- **Option B:** Keep tabConfig as optional "Папки документів за замовчуванням" for tab (fallback for file_upload fields without presetValues).

**Recommended:** Remove tabConfig from tab create/edit. Add presetValues editor in field-definitions-management for file_upload (folders JSON).

**Step 4.4 — Update createTabApi**

- Remove `tabType` from body.
- Keep `tabConfig` optional if we keep it.

**Step 4.5 — Update openForEdit**

- Remove `setTabType(tab.tabType...)` logic.

**File:** `src/features/management/components/vehicles-config/tabs-config-management.tsx`

---

### Phase 5: Vehicle Detail Sheet — DynamicTabs

**Step 5.1 — Unify tab content rendering**

- Remove `tab.tabType === "gallery"` branch.
- Remove `tab.tabType === "documents"` branch.
- Always render: `tab.fields.map(f => <DynamicFieldRenderer ... />)`.

**Step 5.2 — documentFolders**

- For `file_upload` field: pass `documentFolders` from `field.presetValues` (parse JSON).
- Fallback: `parseDocumentFoldersFromTabConfig(tab.tabConfig)` if tabConfig exists and field presetValues empty.

**Step 5.3 — media_gallery**

- Ensure `media_gallery` field is in tab.fields.
- Admin must add media_gallery field to tab instead of creating gallery tab.

**File:** `src/features/vehicles/components/vehicle-detail-sheet.tsx`

---

### Phase 6: DynamicFieldRenderer

**Step 6.1 — file_upload documentFolders**

- Accept `documentFolders` from `field.fieldDefinition.presetValues` (parse JSON).
- Parent (DynamicTabs) passes `documentFolders` from field or tab fallback.

**Step 6.2 — Consolidate text_input**

- Remove `number_input`, `currency_input` branches; use `text_input` + dataType.

**File:** `src/features/vehicles/components/dynamic-field-renderer.tsx`

---

### Phase 7: Field Definitions — file_upload presetValues

**Step 7.1 — field-definitions-management**

- For `widgetType === "file_upload"`: show presetValues editor with hint for folders JSON.
- Example: `{"folders":[{"code":"01_import","label":"01 Імпорт"}]}`.

**File:** `src/features/management/components/vehicles-config/field-definitions-management.tsx`

---

### Phase 8: Data Migration Script

**Step 8.1 — Migrate existing tabs**

- For each tab with `tabType === "gallery"`:
  - Create or find `media_gallery` FieldDefinition.
  - Add TabField linking tab to media_gallery.
- For each tab with `tabType === "documents"`:
  - Create or find `file_upload` FieldDefinition.
  - Set presetValues from tabConfig (folders JSON).
  - Add TabField linking tab to file_upload.
- For `tabType === "fields"`: no change (already has fields).

**File:** `prisma/seed-vehicle-cms.ts` or new `prisma/migrations/scripts/migrate-tab-types.ts`

---

## 4. Risk Assessment

### High Risk

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Data loss** | Existing gallery/documents tabs lose content after migration | Run migration script before DB schema change; ensure tab→field mapping is correct |
| **Breaking admin** | Admins with gallery/documents tabs cannot edit | Migration script creates corresponding fields; admin must re-save after migration |

### Medium Risk

| Risk | Description | Mitigation |
|------|-------------|------------|
| **file_upload folders** | PresetValues format may differ from tabConfig | Document JSON schema; add validation in field-definitions |
| **DisplayConfig** | visibleTabIds may reference tabs by id | Tab ids unchanged; no impact |

### Low Risk

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Legacy widgetType** | number_input, currency_input in DB | DynamicFieldRenderer handles both; consolidate in field-definitions to text_input |
| **tabConfig deprecation** | Some code still reads tabConfig | Keep column nullable; remove after full migration |

---

## 5. Migration Strategy for Existing Data

### 5.1 Pre-Migration Checklist

1. Backup `tab_definitions` and `tab_fields`.
2. List all tabs with `tabType IN ('gallery','documents')`.
3. Ensure `media_gallery` and `file_upload` FieldDefinitions exist.

### 5.2 Migration Script Logic

```ts
// Pseudocode
for (const tab of tabs where tabType === 'gallery') {
  const fd = await findOrCreateFieldDefinition('media_gallery', 'Галерея фото/відео');
  await createTabField(tab.id, fd.id, order: 0);
}
for (const tab of tabs where tabType === 'documents') {
  const fd = await findOrCreateFieldDefinition('file_upload', 'Документи');
  const folders = parseDocumentFoldersFromTabConfig(tab.tabConfig);
  await updateFieldDefinition(fd.id, { presetValues: JSON.stringify({ folders }) });
  await createTabField(tab.id, fd.id, order: 0);
}
```

### 5.3 Execution Order

1. Run migration script (add fields to gallery/documents tabs).
2. Deploy schema migration (drop tab_type).
3. Deploy backend + frontend.
4. Verify admin and vehicle detail sheet.
5. (Optional) Remove tab_config column in a later release.

---

## 6. Dependency Map

```
[TabDefinition]
├── Depends on: Category
├── Affects: TabField, vehicle-config API, DynamicTabs
└── Removal: tabType

[DynamicTabs]
├── Depends on: VehicleConfigTab, DynamicFieldRenderer, VehicleMediaUploader, VehicleDocumentsTab
├── Affects: vehicle-detail-sheet
└── Change: Remove tabType switch; always render fields

[tabs-config-management]
├── Depends on: TabDefinitionItem, TabFieldItem, FieldDefinitionItem
├── Affects: Admin categories/tabs API
└── Change: Remove tabType UI; always show field assignment

[file_upload field]
├── Depends on: presetValues (folders JSON), VehicleDocumentsTab
├── Affects: DynamicFieldRenderer
└── Change: documentFolders from presetValues, fallback tabConfig
```

---

## 7. Validation Checkpoints

1. **After Phase 1:** `prisma migrate dev` succeeds; schema has no tabType.
2. **After Phase 4:** Admin can create/edit tabs; no tab type selector; fields always assignable.
3. **After Phase 5:** Vehicle detail sheet renders all tabs as field blocks; no gallery/documents branches.
4. **After Phase 8:** Existing gallery/documents tabs show media/documents via field blocks.

---

## 8. Estimated Effort

| Phase | Effort | Notes |
|-------|--------|-------|
| 1 | 0.5h | DB migration |
| 2 | 0.5h | API changes |
| 3 | 0.25h | Types |
| 4 | 1h | Admin UI |
| 5 | 0.5h | DynamicTabs |
| 6 | 0.25h | DynamicFieldRenderer |
| 7 | 0.5h | file_upload presetValues |
| 8 | 1h | Migration script |
| **Total** | **~4.5h** | |
