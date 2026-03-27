## Management tables: unified layout (March 2025)

**Goal:** Consistent headers/columns across management UIs; long cell text truncates inside column bounds.

**Config:** `src/config/management-table.ts` — `MGMT_COLGROUP_*` (percent widths summing to 100), shared `mgmtTableHeaderRowClass`, `mgmtTableHeadClass`, `mgmtTableHeadCenterClass`, `mgmtTableCell*` tokens (`max-w-0` on cells for truncate).

**Component:** `src/components/mgmt-table-colgroup.tsx` — `MgmtTableColGroup({ widths })` renders `<colgroup>` with `%` widths.

**Table primitives:** `src/components/ui/table.tsx` — `TableCellText` (`min-w-0 flex-1 truncate`); `TableCell` inner wrapper `overflow-hidden max-w-full gap-1.5`.

**Wired screens:** `statuses-management.tsx`, `product-types-management.tsx`, `field-definitions-management.tsx`, `tabs-config-management.tsx`, `users-table.tsx`, `roles-table.tsx` — each uses `table-fixed` + matching `MGMT_COLGROUP_*` + mgmt classes + `TableCellText` for plain text. **Out of scope:** products list dynamic-column table (`w-max`).

**Removed:** `assertMgmtColPercentsSum100` (was dev-only helper; colgroup component is pure render).
