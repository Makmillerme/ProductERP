# Serena MCP — довідка інструментів (2026-02)

## Активація

Перед роботою: `activate_project` з `project: "nextjs_vmd"`

## Активні інструменти

- **find_symbol** — пошук за name_path_pattern (напр. MyClass/method, /ExactName)
- **get_symbols_overview** — огляд символів у файлі
- **replace_symbol_body** — заміна тіла (name_path, relative_path, body)
- **insert_after_symbol**, **insert_before_symbol** — вставка коду
- **replace_content** — regex/literal заміна (relative_path, needle, repl, mode)
- **find_referencing_symbols** — пошук посилань
- **search_for_pattern** — пошук патерну
- **rename_symbol** — перейменування з оновленням посилань
- **read_file**, **create_text_file** — робота з файлами
- **write_memory**, **read_memory**, **edit_memory** — памʼять проєкту

## relative_path

Відносно `d:\Project\mtruck\new_nodejs_vmd_parser\nextjs_vmd`, напр. `src/app/layout.tsx`

## Команда /serena

Cursor команда в `.cursor/commands/serena.md` — виконувати завдання через Serena MCP.