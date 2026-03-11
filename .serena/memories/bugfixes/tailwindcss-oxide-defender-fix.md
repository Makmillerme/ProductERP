# tailwindcss-oxide Windows Defender fix (2026-02-23)

## Проблема

Windows Defender Application Control блокує `tailwindcss-oxide.win32-x64-msvc.node`. Помилки:
- "Cannot find native binding"
- "An Application Control policy has blocked this file"
- Build Error при обробці `globals.css`

## Рішення

### Варіант 1: Скрипт (потрібні права Адміністратора)

```powershell
# Запустити PowerShell від імені адміністратора
cd D:\Project\mtruck\new_nodejs_vmd_parser\nextjs_vmd
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\add-defender-exclusion.ps1
```

### Варіант 2: Ручне додавання виключення

1. **Налаштування** → **Оновлення та безпека** → **Безпека Windows** → **Захист від вірусів і загроз**
2. **Керування налаштуваннями** → **Виключення** → **Додати виключення** → **Папка**
3. Вказати: `D:\Project\mtruck\new_nodejs_vmd_parser\nextjs_vmd`

### Що НЕ працює

- `Unblock-File` — не допомагає при Application Control
- Перевстановлення `node_modules` — файл блокується при завантаженні, не при встановленні
- Downgrade до Tailwind v3 — shadcn v4 використовує v4-синтаксис

## Результат

Після додавання виключення `npm run dev` та `npm run build` працюють коректно.

**Примітка:** Якщо виключення вже додано, але помилка залишається — спробувати перезавантажити ПК. Зміни політик можуть застосовуватися лише після перезапуску.
