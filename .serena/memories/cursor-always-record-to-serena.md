Правило від користувача: завжди записувати в Serena (проєкт nextjs_vmd) підсумок зробленого під час сесії — рефактори, оптимізації, виправлення, прийняті рішення — щоб мати актуальний стан проєкту та базу знань.

**Команда /serena:** Cursor команда створена в `.cursor/commands/serena.md`. При виклику /serena — виконувати завдання через Serena MCP (find_symbol, replace_symbol_body, insert_*, replace_lines) замість ручних search_replace/write. Rule `.cursor/rules/serena-editing.mdc` (alwaysApply: true) налаштовує Serena-first editing.

Останні сесії:
- Таблиця vehicles: блок «Немає даних» оформлено з іконкою Inbox та відступами; ширина таблиці w-max при наявних даних, w-full при порожньому стані (скрол лише за потреби).
- Видимі колонки: один джерело правди — lazy initializer loadVisibleColumnIds у useState; обгортка VehiclesTableClient монтує таблицю лише на клієнті, щоб уникнути перемикання колонок після гідрівки; прибрано columnsRestored та ефект завантаження колонок.
- Аудит оптимізацій (explore): пріоритети — query keys, lazy CalculatorDialog, мутації без подвійного refetch; useCallback для обробників, memo для рядків таблиці, throttle для saveVisibleColumnIds, sort у nuqs.