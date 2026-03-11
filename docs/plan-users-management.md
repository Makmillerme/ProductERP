# План: сторінка управління користувачами

## Мета
Повноцінна адмін-сторінка для управління користувачами: перегляд, додавання, редагування, видалення, зміна пароля, ролі, бан/розбан, сесії. Відповідно до best practices (RBAC, підтвердження деструктивних дій, обмеження доступу за роллю).

## Стек і обмеження
- **Better-Auth** + плагін **admin**: усі операції через `authClient.admin.*` з клієнта (сесія передається в cookies, сервер перевіряє роль admin).
- **Ролі** з `src/config/roles.ts`: admin, manager, accountant, boss, user. До сторінки «Користувачі» мають доступ лише користувачі з роллю `admin`.
- **Модель User** (Prisma): id, name, email, emailVerified, image, createdAt, updatedAt, role, banned, banReason, banExpires. Account зберігає password (хеш).

---

## 1. Перевірка доступу
- На табі «Користувачі» використовувати `useSession()` з authClient.
- Якщо `session?.user?.role !== "admin"`: показати картку «Доступ заборонено. Потрібна роль Адмін.» замість таблиці та кнопок.
- Не покладатися лише на UI: Better-Auth на сервері відхиляє виклики admin API для не-адмінів.

---

## 2. Список користувачів (таблиця)
- **API:** `authClient.admin.listUsers({ searchValue?, searchField?, searchOperator?, limit, offset, sortBy?, sortDirection?, filterField?, filterValue?, filterOperator? })`.
- **Відповідь:** `{ data: { users, total, limit, offset }, error }`.
- **Колонки:** Email, Ім'я, Роль, Статус (активний / заблоковано), Дата реєстрації. Опційно: кількість сесій.
- **Пошук:** поле вводу, дебаунс ~300 ms, `searchField: "email" | "name"`, `searchOperator: "contains" | "starts_with" | "ends_with"` (на вибір або за замовчуванням contains).
- **Сортування:** клік по заголовку — sortBy (email, name, createdAt, role), sortDirection (asc/desc).
- **Пагінація:** limit (10, 20, 50), offset; кнопки «Попередня» / «Наступна» та індикатор «Сторінка N з M».
- **Оновлення:** після create/update/setRole/ban/unban/remove — перезапит списку (invalidate або refetch).

---

## 3. Додавання користувача
- **Кнопка:** «Додати користувача» у шапці блоку з таблицею.
- **Діалог (форма):**
  - Email (обов’язково, валідація email).
  - Пароль (обов’язково, мінімум 8 символів; опційно індикатор складності).
  - Ім'я (обов’язково).
  - Роль: Select з ROLES (за замовчуванням `user`).
- **Відправка:** `authClient.admin.createUser({ email, password, name, role })`. При успіху закрити діалог, показати toast, оновити таблицю. При помилці (наприклад email зайнятий) показати повідомлення під формою.

---

## 4. Редагування користувача
- **Дії в рядку:** dropdown «Дії» (або іконка) → «Редагувати», «Змінити пароль», «Заблокувати»/«Розблокувати», «Сесії», «Видалити». Не показувати «Видалити» для поточного себе (або показати з попередженням).
- **Редагувати:** діалог з полями Ім'я, Роль. Email не змінюється (або лише через окремий flow зміни email у Better-Auth).
- **API:** `authClient.admin.updateUser({ userId, data: { name?, role? } })`. Поле role оновлюється через updateUser (якщо плагін це підтримує) або окремо `authClient.admin.setRole({ userId, role })`.

---

## 5. Зміна пароля (адміном)
- **Пункт меню:** «Змінити пароль» у dropdown дій по користувачу.
- **Діалог:** поле «Новий пароль» (обов’язково, мін. 8 символів), повтор пароля (перевірка збігу). Без поточного пароля користувача — адмін встановлює новий.
- **API:** `authClient.admin.setUserPassword({ userId, newPassword })`. Успіх → закрити, toast, опційно повідомити, що інші сесії користувача залишаються (або додати «Відкликати всі сесії» окремо).

---

## 6. Бан / розбан
- **Бан:** діалог підтвердження: причина (textarea, опційно), термін (опційно: назавжди / 1 тиждень / 1 місяць → banExpiresIn у секундах). API: `authClient.admin.banUser({ userId, banReason?, banExpiresIn? })`. Після бана — revoke всіх сесій (робиться самим Better-Auth за докой).
- **Розбан:** підтвердження «Розблокувати користувача?». API: `authClient.admin.unbanUser({ userId })`.
- У таблиці статус: бейдж «Заблоковано» (і опційно причину/термін у tooltip або окремій колонці).

---

## 7. Видалення користувача
- **Підтвердження:** AlertDialog «Видалити користувача? Цю дію не можна скасувати. Будуть видалені обліковий запис і пов’язані сесії.»
- **API:** `authClient.admin.removeUser({ userId })`. Не дозволяти видаляти самого себе (або окреме попередження).
- Після успіху оновити список, закрити діалог, toast.

---

## 8. Сесії користувача
- **Пункт:** «Сесії» у dropdown дій → відкривається діалог/панель з переліком сесій.
- **API:** `authClient.admin.listUserSessions({ userId })`. Відобразити: дата/час, IP (якщо є), userAgent (скорочено).
- **Дії:** «Відкликати» одну сесію — `authClient.admin.revokeUserSession({ sessionToken })`; «Відкликати всі» — `authClient.admin.revokeUserSessions({ userId })`.
- Після revoke оновити список сесій у діалозі.

---

## 9. Імпersonate (опційно)
- **Пункт:** «Увійти як користувач» у dropdown. Тільки для адмінів.
- **API:** `authClient.admin.impersonateUser({ userId })` — редірект або оновлення сесії. Повернутися: `authClient.admin.stopImpersonating()`.
- UI: показувати банер «Ви у режимі імпersonate: [email]. Повернутися» з кнопкою stopImpersonating.

---

## 10. Структура файлів (рекомендована)
- `src/features/management/components/users-management/`:
  - `users-management.tsx` — головний компонент: перевірка admin, пошук, пагінація, таблиця, кнопка «Додати».
  - `users-table.tsx` — таблиця з рядками та dropdown дій.
  - `create-user-dialog.tsx` — форма створення (email, password, name, role).
  - `edit-user-dialog.tsx` — форма редагування (name, role).
  - `set-password-dialog.tsx` — новий пароль + повтор.
  - `ban-user-dialog.tsx` — причина, термін бана.
  - `delete-user-dialog.tsx` — підтвердження видалення.
  - `user-sessions-dialog.tsx` — список сесій + revoke.
- У табі «Користувачі» на сторінці Управління рендерити `<UsersManagement />`.

---

## 11. Best practices (звірка)
- **RBAC:** доступ до сторінки та до кнопок за роллю admin.
- **Підтвердження:** видалення та бан — обов’язковий AlertDialog/Dialog з чітким текстом.
- **Пароль:** мінімум 8 символів при створенні та зміні; повтор пароля в діалозі зміни.
- **Обмеження:** не видаляти/не понижувати роль самому собі без явного попередження (або заборона видалення себе).
- **Відповіді API:** обробляти error з authClient, показувати message користувачу (toast або під формою).
- **Оптимістичний UI:** за бажанням оновлювати таблицю після кожного успішного виклику без затримки.

---

## 12. Порядок впровадження
1. Компонент UsersManagement + перевірка admin + виклик listUsers і таблиця (пошук, сортування, пагінація).
2. Create user dialog + інтеграція з кнопкою «Додати».
3. Edit user dialog + Set password dialog + dropdown дій у рядку.
4. Ban / Unban діалоги + бейдж статусу в таблиці.
5. Delete user з підтвердженням.
6. User sessions dialog (list + revoke one / revoke all).
7. Опційно: impersonate + банер stop.
