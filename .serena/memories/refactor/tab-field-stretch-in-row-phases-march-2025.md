## Phases (plan + execution)

**Phase 0:** Prior fixes documented (grid cursor, Select unconfigured, tab save guard).

**Phase 1:** Prisma `TabField.stretchInRow` + migration file `20260325120000_add_tab_field_stretch_in_row/migration.sql`. Run `npx prisma migrate deploy` (or dev) locally when DB available.

**Phase 2:** API `admin/tabs/[id]` TabFieldInput + createMany persist stretchInRow.

**Phase 3:** Types: `ProductConfigTabField`, `TabFieldItem`, preview modal PATCH maps.

**Phase 4:** `tabs-config-management`: AssignedField.stretchInRow, Checkbox + i18n `stretchInRow` / `stretchInRowHint`, save only when narrow colSpan<3.

**Phase 5:** `product-card-grid-segments.ts` + `DynamicTabs` segment render: stretchGroup for 2+ consecutive narrow fields with stretchInRow in same row; parent `sm:col-span-n`, inner grid gap-4.

**Phase 6:** Regression: tsc, locales generate; verify two adjacent stretch fields on card.
