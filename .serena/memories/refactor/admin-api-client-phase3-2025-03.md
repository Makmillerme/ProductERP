## Admin API client (фаза 3 UI unification)

**Дата:** 2025-03-25

### Що зроблено
- Додано `src/lib/api/admin/client.ts` — єдиний шар для `/api/admin/*`: шлях, fetch, парсинг `{ error }` з JSON, `adminGetJson<T>` та `adminMutationJson` для мутацій.
- Додано `src/lib/api/admin/catalog.ts` — категорії та типи продуктів з настроюваним ключем помилки для типів.
- Міграція management: замість сирого fetch — клієнт у перелічених компонентах (див. памʼятку `audit/ui-unification-refactor-scope-2025-03`, Фаза 3).
- `product-card-preview-modal.tsx`: тип `PreviewTabDetail` + `adminGetJson<PreviewTabDetail>` для завантаження табу.

### Перевірки
- `npx tsc --noEmit` — OK.
- `eslint` на змінених файлах — OK.
- Grep: у `src/features/management` немає `fetch('/api/admin` / fetch(\"/api/admin\")`.

### Подальше (за потреби)
- Розширити клієнт на інші частини апки поза management, якщо дублювання залишиться.
