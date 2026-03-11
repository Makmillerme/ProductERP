# План реалізації: Goverla, Користувачі, Сесії, Таби Management

## 1. Goverla API — курси валют у хедері

**Мета:** Модуль у головному хедері з курсами з `https://api.goverla.ua/graphql` (POST, GraphQL query `Point`). Відображення: `data.point.rates[]` → `bid.absolute` (купівля), `ask.absolute` (продаж), `currency.codeAlpha`, `currency.name`. UI через shadcn.

**Кроки:**

1. **Новий feature-модуль курсу валют**
   - `nextjs_vmd/src/features/currency/` — папка модуля.
   - `nextjs_vmd/src/features/currency/api.ts` — клієнт: `fetch("https://api.goverla.ua/graphql", { method: "POST", body: JSON.stringify({ query: PointQuery }) })`. Типи для відповіді: `PointRates`, `Currency`, `Rate` (bid.absolute, ask.absolute).
   - `nextjs_vmd/src/features/currency/queries.ts` або в `api.ts` — константа GraphQL-запиту `Point` з полями `point { rates { bid { absolute }, ask { absolute }, currency { codeAlpha, name } } }`.
   - `nextjs_vmd/src/features/currency/use-rates.ts` — хук (TanStack Query): виклик API, перетворення `data.point.rates` у масив для UI, staleTime ~5–10 хв.
   - `nextjs_vmd/src/features/currency/currency-rates-header.tsx` — компонент для хедера: використати shadcn (наприклад `DropdownMenu` або `Popover` + список валют). Показувати код валюти та buy/sell (або тільки основні). Обробка loading/error (мінімально: скелетон або “—”).
   - `nextjs_vmd/src/features/currency/index.ts` — експорт публічного API модуля.

2. **Інтеграція в хедер**
   - `nextjs_vmd/src/components/layout/app-header.tsx` — імпорт `CurrencyRatesHeader`, розмістити між breadcrumbs і кнопкою калькулятора (або перед нею). Flex-контейнер: не займати зайвого місця на малих екранах (наприклад, показувати іконку + popover по кліку).

**Ключові рішення:**
- Запит тільки `Point` (без змінних, якщо API не вимагає). Якщо потрібен point id — уточнити в документації Goverla.
- Помилки API не ламають хедер: показувати fallback (наприклад “Курси тимчасово недоступні” у popover).
- Не хардкодити список валют у UI — використовувати `rates[]` з відповіді (або фільтр по `codeAlpha` для основних: USD, EUR, PLN тощо).

---

## 2. Таблиця користувачів — без горизонтального скролу, вирівнювання

**Мета:** Прибрати горизонтальний скрол, вирівняти заголовки та комірки по лівому краю по вертикалі.

**Файли:**

- `nextjs_vmd/src/features/management/components/users-management/users-table.tsx`

**Кроки:**

1. Прибрати горизонтальний скрол: обгортка таблиці не повинна мати `overflow-x-auto`. Якщо таблиця в `Card`/`div` з `overflow-hidden`, переконатися що сама таблиця не роздуває контейнер (залишити `table-fixed`, `w-full`).
2. У `nextjs_vmd/src/components/ui/table.tsx` — контейнер таблиці має `overflow-x-auto` і `min-w-max`. Для users-table варіанти: (a) передати в `Table` `className` з перевизначенням (наприклад `overflow-visible` через контекст неможливо), або (b) обгорнути таблицю в `div` з `overflow-hidden` і задати колонкам мінімальні шири через `min-w-0` де потрібно, щоб текст обрізався. Рекомендація: у `users-table.tsx` обгорнути `<Table>` у `<div className="overflow-hidden rounded-md border">` і прибрати дублювання border з внутрішнього контейнера; у `Table` залишити поведінку за замовчуванням для інших місць, або додати опціональний prop `noScroll` і в table.tsx умовно не додавати `overflow-x-auto` і `min-w-max`.
3. Вирівнювання: у всіх `TableHead` і `TableCell` замінити `text-center` на `text-left`, `align-middle` залишити. Прибрати класи типу `truncate text-center` і замінити на `truncate text-left` для комірок з текстом.

**Ключові рішення:**
- Якщо не хочеться змінювати глобальний `table.tsx`, достатньо в users-table обгорнути таблицю в контейнер з `overflow-hidden` і задати колонкам відсоткові шири так, щоб сума = 100% (вже є), тоді горизонтального скролу не буде.
- Вертикальне вирівнювання: залишити `align-middle` для рядків (h-11 уже є).

---

## 3. «Змінити пароль» всередині модалки «Редагувати користувача»

**Мета:** Один діалог редагування: профіль + зміна пароля (секція/вкладка всередині).

**Файли:**

- `nextjs_vmd/src/features/management/components/users-management/edit-user-dialog.tsx`
- `nextjs_vmd/src/features/management/components/users-management/set-password-dialog.tsx` — логіку перенести в edit, файл можна видалити або залишити тільки як експорт обгортки для сумісності (не рекомендується, краще один джерело правди).
- `nextjs_vmd/src/features/management/components/users-management/users-management.tsx`
- `nextjs_vmd/src/features/management/components/users-management/users-table.tsx`

**Кроки:**

1. У `edit-user-dialog.tsx`: додати стан для пароля (нова пароль, повтор, помилка), секцію форми «Змінити пароль» (опційно — Tabs всередині діалогу: «Профіль» | «Пароль», або просто блок під полями профілю). При сабміті пароля викликати `authClient.admin.setUserPassword`. Після успіху — очистити поля пароля, показати toast.
2. Видалити окремий виклик `SetPasswordDialog` з `users-management.tsx` і стан `passwordUser`; при відкритті Edit передавати лише `editUser`.
3. У `users-table.tsx`: прибрати пункт меню «Змінити пароль» та callback `onSetPassword`; видалити prop `onSetPassword` з інтерфейсу і з виклику в `users-management.tsx`.
4. Видалити імпорт і використання `SetPasswordDialog` у `users-management.tsx`. Опційно — видалити файл `set-password-dialog.tsx` або залишити для історії (рекомендація: видалити).

**Ключові рішення:**
- Один діалог — один стан `editUser` в батьківському компоненті. Пароль — внутрішній стан EditUserDialog.
- Валідація пароля як у поточному SetPasswordDialog (мінімум 8 символів, збіг полів).

---

## 4. Діалог сесій користувача — таблиця та кнопки дій

**Мета:** Коректне відображення таблиці, вирівнювання, кнопки дій завжди видимі.

**Файл:**

- `nextjs_vmd/src/features/management/components/users-management/user-sessions-dialog.tsx`

**Кроки:**

1. Структура: `DialogContent` — flex-col, зверху `DialogHeader`, по центру `DialogBody` з `overflow-auto` і таблицею всередині, знизу `DialogFooter` з кнопкою «Відкликати всі сесії» (залишити в футері, щоб завжди була видима).
2. Таблиця: обгорнути в контейнер з фіксованою max-height і `overflow-auto`, щоб скролилась тільки таблиця, а не весь діалог. Заголовки та комірки — `text-left`, `align-middle`. Для колонки з кнопкою «Відкликати» — `shrink-0` і достатня ширина, щоб кнопка не переносилась.
3. Колонки: задати ширини (наприклад дати — фіксована ширина, User-Agent — min-w-0 flex-1 truncate), остання колонка — тільки кнопки, без переносу.
4. Переконатися що `DialogFooter` завжди в зоні видимості (не скролиться разом з тілом). Це вже забезпечується структурою Dialog з flex: header/body/footer; body з overflow-auto.

**Ключові рішення:**
- Кнопка «Відкликати» в кожному рядку — залишити в таблиці, з фіксованою шириною колонки.
- Футер діалогу — лише «Відкликати всі сесії»; не дублювати в тілі.

---

## 5. Management: таб «Користувачі та Ролі» з підтабами

**Мета:** Перейменувати таб «Користувачі» на «Користувачі та Ролі»; всередині два підтаби: «Користувачі» (список) і «Ролі» (управління ролями).

**Файли:**

- `nextjs_vmd/src/features/management/components/management-page.tsx`
- Новий компонент для підтабів (наприклад `UsersAndRolesTab.tsx` або inline у management-page).
- Новий компонент для розділу ролей (наприклад `RolesManagement.tsx` у `users-management` або окрема папка `roles-management`).

**Кроки:**

1. У `management-page.tsx`: змінити константу табів — замість одного значення `users` використати значення `users-and-roles` (або залишити `users` для URL і тільки змінити лейбл). Лейбл таба: «Користувачі та Ролі».
2. Всередині `TabsContent value="users"` (або нового значення): рендерити не одразу `<UsersManagement />`, а внутрішній блок з підтабами (Tabs): «Користувачі» | «Ролі». Для «Користувачі» — рендер `UsersManagement`, для «Ролі» — новий компонент `RolesManagement`.
3. Стейт підтабів: через `useQueryState` (наприклад `tab2` або `subtab`) з значеннями `users` та `roles`, щоб URL відображав поточний підтаб (наприклад `?tab=users&subtab=roles`). Default — `users`.
4. Компонент `RolesManagement`: новий файл (наприклад `nextjs_vmd/src/features/management/components/roles-management/roles-management.tsx`). Поки що можна показати картку з описом ролей з `@/config/roles` (ROLE_LABELS) і текстом типу «Управління ролями — у розробці» або простий список ролей без редагування. Пізніше — CRUD ролей якщо буде бекенд.

**Ключові рішення:**
- URL: `?tab=users` (або `users-and-roles`) для головного таба Management; `&subtab=users` | `subtab=roles` для підтабів. Зберегти сумісність посилань на «Користувачі».
- Структура: Management → [Завантажувач | Облік авто | Користувачі та Ролі]. Користувачі та Ролі → [Користувачі | Ролі].

---

## Порядок виконання (рекомендований)

1. **П.2** — таблиця користувачів (швидкі зміни, без залежностей).
2. **П.4** — діалог сесій (тільки один файл).
3. **П.3** — перенесення пароля в Edit User (рефактор діалогів і меню).
4. **П.5** — перейменування таба та підтаби + заглушка Ролі.
5. **П.1** — Goverla API та компонент у хедері (новий модуль і інтеграція).

Після виконання оновлювати базу знань у Serena (код, рішення, зміни в структурі).
