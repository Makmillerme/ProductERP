Phase 5 + Phase 6 EAV рефакторинг завершено.

**Phase 5 (Frontend):**
- dynamic-field-renderer: видалено isSystem, systemColumn; productKey = code === "status" ? "product_status_id" : (code ?? id); compositeKey = code ?? id
- use-list-config: id/code = fd.code ?? fd.id (без systemColumn)
- field-definitions-management: формула та порівняння — fd.code ?? fd.id
- display-config, api: коментарі оновлено (code замість systemColumn)

**Phase 6 (Cleanup):**
- Видалено src/config/system-columns.ts
- SNAKE_TO_CAMEL, VALID_SORT_KEYS вже були видалені в Phase 2

**Примітка:** FieldDefinition.systemColumn у Prisma залишається (backward compat для parser/field-mapping). API field-definitions приймає systemColumn, передається null при створенні. Локалі en/uk мають systemColumn strings для UI адмінки — можна оновити пізніше.