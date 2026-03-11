# nextjs_vmd — виправлення після рев'ю та конвенції

**Виправлення (лют 2025):** (1) Providers — один компонент на сервері й клієнті, no-op persister при storage undefined. (2) pageSizeClamped — значення тільки з PAGE_SIZES у логіці та API. (3) Прибрано аліас sortedRows, використовується items.

**Конвенції:** Рефакторинг через Serena. Shadcn first — не створювати кастомні примітиви. Планування складних задач — sequential-thinking MCP. Не запускати npm run dev без явного запиту. PowerShell для команд. Відповідати українською.
