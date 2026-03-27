# Модернізація завантаження даних і мутацій

Цей документ фіксує підхід команди до швидкого UI (optimistic updates, вузька інвалідація) та перевірок перед релізом.

## Dev: порядок запуску та типові помилки

1. Спочатку підніміть **PostgreSQL** (Docker або локальний сервіс), перевірте `DATABASE_URL` у `.env`.
2. Потім `npm run dev`.

Якщо на `GET /api/auth/get-session` з’являється **Prisma `ECONNREFUSED`** — з’єднання з БД ще не доступне. Це не баг Next.js; після старту БД помилка зникає.

У продакшені використовуйте **connection pooling** (наприклад PgBouncer або pooled URL у хостера).

## Чеклист мутацій (TanStack Query)

Для кожної нової `useMutation` перевірте:

| Питання | Очікування |
|--------|------------|
| Які `queryKey` справді змінюються після операції? | Інвалідувати лише їх (або префікс свідомо). |
| Чи можна оновити кеш через `setQueryData` до відповіді сервера? | Так для списків табів, простих CRUD. |
| Що при `onError`? | Rollback з контексту `onMutate`. |
| Подвійний клік / повторний DELETE? | Блокування pending, idempotent DELETE (404 = ок), або Set «вже видалено». |
| Чи потрібен debounce? | Для автозбереження з клавіатури — так (300–500 ms). |

### Ключі кешу (орієнтир)

- Таби категорії: `["admin", "category-tabs", categoryId]`
- Деталь таба: `["admin", "tab-detail", tabId]`
- Конфіг картки за типом: `["product-config", productTypeId]` — див. `productConfigQueryKeys` у `use-product-config.ts`
- List / display bootstrap за категорією: `["list-config", categoryId]` — див. `listConfigQueryKeys` у `use-list-config.ts`
- Глобальні зміни полів (визначення полів): зазвичай потрібна інвалідація всіх `list-config` та `product-config` (префіксні ключі).

## Допоміжна функція

`invalidateCategoryDisplayCaches` у [`src/lib/invalidate-display-caches.ts`](../src/lib/invalidate-display-caches.ts) — інвалідує лише list-config для категорії та product-config для типів товарів цієї категорії (після змін табів дисплею).

## Сесія (Better Auth)

У [`auth-client.ts`](../src/lib/auth-client.ts) для зменшення фонових запитів можна вимкнути refetch при фокусі вікна (`sessionOptions.refetchOnWindowFocus: false`). Сесію оновлюйте після логіну/лог-ауту явно.

## Debounce (`src/lib/debounce.ts`)

Утиліта `debounce` для майбутніх форм з автозбереженням — викликати обгорнуту функцію з `onChange`, а саму мутацію виконувати лише після паузи введення.

## Фаза 5 (опційно): черга на сервері

Потрібна лише для масових або довгих операцій (імпорт, синхронізація): Redis + worker, ідемпотентні job id, ретраї, dead-letter. Звичайний admin CRUD покривається optimistic updates + вузькою інвалідацією.

## Подальші кроки

- Поширити optimistic патерн з `tabs-config-management` на інші екрани керування.
- Періодично переглядати `grep invalidateQueries` у `src/features/management` на надто широкі ключі.
