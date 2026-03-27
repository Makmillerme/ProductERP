## Видалення визначення поля (admin)
- `DELETE /api/admin/field-definitions/[id]`: прибрано 409 за наявності `TabField` — Prisma каскадно видаляє `tab_fields`, `product_field_values`, `data_source_mappings` тощо (`onDelete: Cascade`).
- `GET ...?usage=1`: додано `usage.tabPlacements[]` (categoryName, tabName, productTypeName) та `usage.productValuesCount` для діалогу підтвердження.
- UI: `field-definitions-management` — кнопка «Видалити» відкриває `ConfirmDestructiveDialog`, підвантажує usage через react-query, показує список і кількість значень у товарах, підтвердження викликає `confirmDeleteField`.
