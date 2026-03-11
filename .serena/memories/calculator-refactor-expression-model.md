Калькулятор (nextjs_vmd) переведено на рядкову модель виразів.

Структура:
- calculator-expression.ts: токенайзер (tokenize), resolvePercent, Shunting yard (evaluate), evaluateExpression(expr), getDisplayFromExpression(expr), formatNumber, formatExpressionForDisplay. Підтримка: числа, +-*/^, (), √, ², 1/, унарний −, %, π, e. Семантика %: A op B% = A op (B% від A).
- calculator-dialog.tsx: стан expression (string) + display (string). Кнопки лише додають до expression або викликають evaluateExpression при =. Унарні (√, x², 1/x, +/−) вставляють підвираз і оновлюють display через skipSyncRef. Після = expression та display стають результатом для продовження. Клавіатура: 0-9, ,.+-*/^, Enter, Escape, Backspace, (, ). Порталізація та перетягування без змін.

Видалено: prev, op, displayExpression, parenStack, hasPendingOp, percentMode, parenStackRef. Вся обчислювальна логіка в calculator-expression.ts.