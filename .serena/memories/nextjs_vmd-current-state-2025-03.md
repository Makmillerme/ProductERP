2025-03-11. ProductERP (GitHub: Makmillerme/ProductERP). Next.js 15.5, React 19, Tailwind 4, Prisma 7.4, Better-Auth, TanStack Query (persist), nuqs.

Features: products (catalog, product-detail-sheet, EAV), management (data-model, display, api-integrations, automations, users), currency (goverla), home, kanban, settings. No vehicles — повністю Product/ProductType.

Prisma: Product, ProductMedia, ProductDocument, ProductFieldValue, ProductType, ProductStatus, Category, TabDefinition, TabField, FieldDefinition, FieldDefinitionCategory, FieldDefinitionProductType, DisplayConfig, DataSourceMapping, Role, RolePermission, User, Session, Account, Verification. EAV: ProductFieldValue (textValue, numericValue, dateValue).

Routes: /, /catalog, /catalog/[categoryId], /management, /management/data-model, /management/display, /management/api-integrations, /management/automations, /management/users, /login, /settings. Nav: NAV_MAIN з dynamicItems categories.

i18n: en.json, uk.json → generate-locales.js → en.generated.ts, uk.generated.ts. System tab golovna. config/product-documents.ts. node >=20.19.0.