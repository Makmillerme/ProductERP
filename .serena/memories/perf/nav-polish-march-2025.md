## Навігація та навантаження (perf polish)

### Middleware
- `src/middleware.ts`: замість HTTP `fetch(/api/auth/get-session)` використовується `getSessionCookie` з `better-auth/cookies` (`hasSessionCookie`). Редіректи: без cookie → `/login` з `callbackUrl`; з cookie на `/login` → `/`. Повна сесія лишається в API через `auth.api.getSession`.

### TanStack Query — ключі
- `src/lib/query-keys.ts`: `managementAdminKeys` (categories, productTypes, fieldDefinitions, statuses, roles, users), `managementPublicKeys.statuses`, `managementTabKeys` (allTabDetails, allCategoryTabs, tabDetail, categoryTabs).
- Екрани management імпортують ці ключі замість локальних `const …_KEY`.

### Персист
- `src/components/layout/providers.tsx`: `persistOptions.dehydrateOptions.shouldDehydrateQuery` — не дегідрує (не пише в localStorage) запити з коренем ключа `admin` або `product-config`; для інших використовується `defaultShouldDehydrateQuery`.

### API
- `src/app/api/product-config/[productTypeId]/route.ts`: вкладки з `select` без вкладеного `fieldDefinition`; унікальні `fieldDefinitionId` → один `fieldDefinition.findMany` + мапа; ранній JSON при відсутності `categoryId`.
- `src/app/api/admin/tabs/[id]/route.ts`: `fieldDefinition` через явний `select` (скаляри моделі), без зайвих relation.
