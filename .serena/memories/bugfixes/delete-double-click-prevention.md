# Захист від повторного натискання при видаленні

## Проблема
При швидких діях (додавання, видалення) користувач міг кілька разів натиснути кнопку видалення в відкритому sheet. Перший DELETE проходив успішно (200), наступні — по вже видаленому запису (404).

## Рішення
1. **Guard у handleDelete:** `if (!selectedField || deleteMut.isPending) return` — блокує повторний виклик під час виконання мутації.
2. **disabled кнопки:** `disabled={saving || deleteMut.isPending}` — кнопка неактивна одразу після старту мутації (isPending оновлюється синхронно).

## Змінені файли
- `field-definitions-management.tsx` — handleDelete guard, кнопка Видалити
- `statuses-management.tsx` — аналогічно
- `tabs-config-management.tsx` — handleDelete guard, кнопка в sheet, AlertDialogAction в діалозі підтвердження