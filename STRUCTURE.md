# Структура проєкту nextjs_vmd

Ієрархія папок і файлів розділена на **централізоване**, **загальне (shell)** та **модулі по фічах**. Усе, що спільне — в одному місці; що стосується однієї фічі — у своєму модулі.

---

## Дерево `src/`

```
src/
├── app/                        # Роутинг (тонкий шар)
│   ├── (app)/                  # Група маршрутів з сайдбаром
│   │   ├── layout.tsx          # Shell: SidebarProvider + AppSidebar + AppHeader + main
│   │   ├── page.tsx            # Головна → features/home
│   │   ├── vehicles/page.tsx   # → features/vehicles
│   │   ├── kanban/page.tsx     # → features/kanban
│   │   └── settings/page.tsx   # → features/settings
│   ├── layout.tsx              # Корінь: html, body, TooltipProvider, Providers
│   └── globals.css
│
├── components/
│   ├── layout/                 # Загальний каркас (shell)
│   │   ├── app-sidebar.tsx     # Сайдбар навігації
│   │   ├── app-header.tsx      # Хедер + тригер сайдбару + юзер-меню
│   │   ├── providers.tsx       # QueryClient + NuqsAdapter
│   │   └── index.ts            # Публічний API layout
│   └── ui/                     # Тільки примітиви shadcn (не змінювати вручну, тільки CLI)
│
├── config/                     # Централізований конфіг
│   ├── navigation.ts           # NAV_MAIN, NAV_FOOTER, APP_NAME — єдине джерело правди для меню
│   └── index.ts
│
├── features/                   # Модулі по фічах (внутрішня логіка)
│   ├── home/
│   │   ├── components/         # Компоненти тільки для цієї фічі
│   │   │   └── home-page.tsx
│   │   └── index.ts            # Публічний API фічі (експорт для app)
│   ├── vehicles/
│   │   ├── components/
│   │   │   └── vehicles-page.tsx
│   │   └── index.ts
│   ├── kanban/
│   │   ├── components/
│   │   │   └── kanban-page.tsx
│   │   └── index.ts
│   └── settings/
│       ├── components/
│       │   └── settings-page.tsx
│       └── index.ts
│
├── lib/                        # Централізовані утиліти та клієнти
│   ├── utils.ts                # cn() та інші хелпери
│   └── prisma.ts               # Синглтон PrismaClient (заглушка до налаштування adapter/accelerateUrl)
│
├── hooks/                      # Глобальні хуки (спільні для всього додатку)
│   └── use-mobile.ts
│
├── types/                      # Глобальні типи (спільні)
│   └── index.ts
│
└── generated/                  # Згенерований код (Prisma) — не редагувати
    └── prisma/
```

---

## Призначення шарів

| Шар | Призначення | Де змінювати |
|-----|-------------|--------------|
| **app/** | Роути, layout, глобальні стилі. Мінімум логіки, лише імпорт з `features` та `components/layout`. | Додавати роути, змінювати кореневий або (app) layout. |
| **components/layout/** | Сайдбар, хедер, провайдери — один раз на весь додаток. | Тут змінювати shell (назва додатку, пункти меню беруться з `config`). |
| **components/ui/** | Примітиви shadcn. | Тільки через `npx shadcn@latest add <component>`. |
| **config/** | Назва додатку, меню, майбутні глобальні константи. | Тут змінювати пункти меню та APP_NAME. |
| **features/<name>/** | Все, що стосується однієї фічі: компоненти, хуки, типи, API. | Усе внутрішнє для фічі — тут; зовні імпортувати лише з `features/<name>/index.ts`. |
| **lib/** | Утиліти, Prisma-клієнт, спільні хелпери. | Загальні речі без прив’язки до фічі. |
| **hooks/** | Хуки, які використовуються в кількох місцях або в layout. | Глобальні хуки. |
| **types/** | Типи, які використовуються в кількох фічах або в lib. | Спільні типи. |

---

## Правила

1. **Сторінки в `app`** — тонкі: лише імпорт сторінкового компонента з `features` і `return <FeaturePage />`.
2. **Меню та назва додатку** — тільки в `config/navigation.ts` (і експорт через `config/index.ts`). Сайдбар імпортує звідси.
3. **Нова фіча** — нова папка в `features/<name>` з підпапками `components/`, за потреби `hooks/`, `types.ts` та публічним `index.ts`.
4. **Спільний код між фічами** — виносити в `lib/`, `hooks/` або `types/`.
5. **UI-примітиви** — лише з shadcn, додавати через CLI; кастом лише налаштування (пропси, стилі), без нових примітивів у `components/ui`.

---

## Аліаси імпортів (tsconfig)

- `@/components` → `src/components`
- `@/components/ui` → примітиви
- `@/components/layout` → shell (сайдбар, хедер, провайдери)
- `@/config` → конфіг (навігація, константи)
- `@/features/<name>` → публічний API фічі
- `@/lib` → утиліти, prisma
- `@/hooks` → глобальні хуки
- `@/types` → глобальні типи
- `@/generated/prisma` → Prisma-клієнт (згенерований)
