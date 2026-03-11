# VMD Parser (Next.js)

Веб-додаток парсера ВМД на Next.js 15 + shadcn/ui.

## Структура проєкту

**Детальний опис ієрархії папок і правил — у [STRUCTURE.md](./STRUCTURE.md).**

Коротко:

- **`app/`** — роути й layout (тонкий шар).
- **`components/layout/`** — сайдбар, хедер, провайдери (загальний каркас).
- **`components/ui/`** — примітиви shadcn (додавати тільки через CLI).
- **`config/`** — централізований конфіг (назва додатку, меню).
- **`features/<name>/`** — модулі по фічах (власні компоненти, хуки, типи).
- **`lib/`** — утиліти, Prisma-клієнт.
- **`hooks/`**, **`types/`** — глобальні хуки та типи.

## Стек

- **Next.js 15** (App Router, Turbopack), **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4**, **shadcn/ui** (лише примітиви з реєстру, без кастомних компонентів)
- **Prisma** + **PostgreSQL**
- **Zustand** (глобальний стан), **TanStack Query** (серверний стан), **nuqs** (стан у URL)

## Структура layout

- **Кореневий layout**: `TooltipProvider`, `Providers` (QueryClient + NuqsAdapter).
- **Група (app)**: усі сторінки з сайдбаром і хедером:
  - `SidebarProvider` → `AppSidebar` (згортання в іконки) + `SidebarInset`:
    - `AppHeader` (тригер сайдбару + меню користувача);
    - `main` — область контенту для сторінок.

## Маршрути

| Шлях        | Опис              |
|------------|-------------------|
| `/`        | Головна (після входу) |
| `/login`   | Сторінка входу (email + пароль) |
| `/vehicles`| Таблиця ВМД (заглушка) |
| `/kanban`  | Канбан (заглушка) |
| `/settings`| Налаштування (заглушка) |

Усі маршрути, крім `/login` та `/api/auth/*`, захищені: при відсутності сесії (JWT/cookie) відбувається редірект на `/login`. Реєстрації немає — приватний застосунок.

## Чому в консолі 404 для /api/plugin/mcp та .well-known/…

Ці запити робить Cursor (MCP) або OAuth/OIDC-клієнти для discovery. У цьому проєкті таких ендпоінтів немає, тому 404 очікувані; на роботу додатку вони не впливають.

## Команди

```bash
npm run dev    # dev-сервер (Turbopack)
npm run build  # збірка
npm run start  # production
```

## База даних

1. Задайте `DATABASE_URL` у `.env` (приклад у `.env.example`).
2. Для локального Postgres: `postgresql://postgres:Rty45678+@localhost:5432/vmd_parser`.
3. Міграції: `npx prisma migrate dev` (після додавання моделей).

## Shadcn First

Нові UI-компоненти додавати лише через CLI:  
`npx shadcn@latest add <component>`.

Дизайн лише на основі shadcn/ui, без власних примітивів.
