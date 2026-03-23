/**
 * Парсинг та обчислення виразів калькулятора.
 * Модель: один рядок виразу → токени → обчислення (Shunting yard + RPN).
 *
 * Підтримка: числа (з комою/крапкою), + - * / ^, ( ), √, ², 1/, унарний −, %, π, e.
 * Семантика %: "A op B%" = A op (B% від A). Приклад: 1000 - 5% = 950.
 */

export type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "openParen" }
  | { type: "closeParen" }
  | { type: "unary"; value: "sqrt" | "square" | "reciprocal" | "negate" }
  | { type: "constant"; value: "pi" | "e" }
  | { type: "percent" };

/** Токен з позиціями в нормалізованому рядку (для заміни останнього терму). */
export type TokenWithSpan = Token & { start: number; end: number };

const OP_PRIORITY: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
};

/** Нормалізація рядка: заміна символів відображення на однозначні для парсингу */
export function normalizeInput(s: string): string {
  return s
    .replace(/\s/g, "")
    .replace(/\uFF08/g, "(")
    .replace(/\uFF09/g, ")")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, ".");
}

/**
 * Дописує закриваючі дужки в кінець виразу, якщо є незакриті.
 * Приклад: "√(9" → "√(9)". Потрібно для коректного обчислення при натисканні = без закриття дужок.
 */
export function balanceParentheses(expr: string): string {
  const s = normalizeInput(expr).trim();
  if (!s) return expr;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth = Math.max(0, depth - 1);
  }
  if (depth <= 0) return expr.trim();
  return expr.trim() + ")".repeat(depth);
}

/**
 * Токенайзер: рядок → масив токенів.
 * Числа, оператори, дужки, √ (prefix), ² (postfix), 1/ (prefix), % (postfix), π, e.
 * Опційно повертає токени з полями start/end у нормалізованому рядку.
 */
export function tokenize(expr: string): Token[] {
  return tokenizeInternal(expr, false);
}

/**
 * Токенайзер з позиціями (start/end) у нормалізованому рядку для заміни останнього терму.
 */
export function tokenizeWithSpans(expr: string): TokenWithSpan[] {
  return tokenizeInternal(expr, true) as TokenWithSpan[];
}

function tokenizeInternal(expr: string, withSpans: boolean): Token[] {
  const s = normalizeInput(expr);
  const out: Token[] = [];
  let i = 0;

  const lastStart: number[] = [0];
  function push<T extends Token>(token: T): T {
    out.push(token);
    if (withSpans && out.length > 0) {
      const t = out[out.length - 1] as TokenWithSpan;
      t.start = lastStart[0];
      t.end = i;
    }
    return token;
  }

  function skipSpaces() {
    while (i < s.length && /\s/.test(s[i])) i++;
  }

  function readNumber(): boolean {
    const start = i;
    if (s[i] === "." && /[0-9]/.test(s[i + 1])) {
      i++;
      while (i < s.length && /[0-9]/.test(s[i])) i++;
      push({ type: "number", value: Number.isNaN(parseFloat("0." + s.slice(start + 1, i))) ? 0 : parseFloat("0." + s.slice(start + 1, i)) });
      return true;
    }
    if (!/[0-9]/.test(s[i])) return false;
    while (i < s.length && /[0-9]/.test(s[i])) i++;
    if (s[i] === "." || s[i] === ",") {
      i++;
      while (i < s.length && /[0-9]/.test(s[i])) i++;
    }
    const n = parseFloat(s.slice(start, i).replace(",", "."));
    push({ type: "number", value: Number.isNaN(n) ? 0 : n });
    return true;
  }

  function readConstant(): boolean {
    if (s.slice(i, i + 1) === "π" || s.slice(i, i + 2) === "pi") {
      push({ type: "constant", value: "pi" });
      i += s[i] === "π" ? 1 : 2;
      return true;
    }
    if ((s[i] === "e" || s[i] === "E") && !/[0-9.]/.test(s[i + 1] ?? "")) {
      push({ type: "constant", value: "e" });
      i++;
      return true;
    }
    return false;
  }

  while (i < s.length) {
    skipSpaces();
    if (i >= s.length) break;
    if (withSpans) lastStart[0] = i;

    if (readConstant()) {
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (readNumber()) continue;

    if (s[i] === "√" || s.slice(i, i + 4) === "sqrt") {
      push({ type: "unary", value: "sqrt" });
      i += s[i] === "√" ? 1 : 4;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s[i] === "²" || s.slice(i, i + 2) === "^2") {
      push({ type: "unary", value: "square" });
      i += s[i] === "²" ? 1 : 2;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s.slice(i, i + 2) === "1/") {
      push({ type: "unary", value: "reciprocal" });
      i += 2;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s[i] === "%") {
      push({ type: "percent" });
      i++;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s[i] === "(") {
      push({ type: "openParen" });
      i++;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s[i] === ")") {
      push({ type: "closeParen" });
      i++;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }
    if (s[i] === "-") {
      const last = out[out.length - 1];
      const unaryContext = !out.length || last.type === "openParen" || last.type === "op";
      if (unaryContext) {
        push({ type: "unary", value: "negate" });
        i++;
        if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
        continue;
      }
    }
    if ("+-*/^".includes(s[i])) {
      const op = s[i] === "*" ? "*" : s[i] === "/" ? "/" : s[i] as "+" | "-" | "^";
      push({ type: "op", value: op });
      i++;
      if (withSpans && out.length > 0) (out[out.length - 1] as TokenWithSpan).end = i;
      continue;
    }

    i++;
  }

  return out;
}

/**
 * Вставляє неявне множення: число/константа/")" перед "("/√/1//π/e → вставити *.
 * Приклади: 25(6-9) → 25*(6-9), 9√9 → 9*√9.
 */
function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const leftCanMultiply = (t: Token) =>
    t.type === "number" || t.type === "constant" || t.type === "closeParen";
  const rightNeedsMultiply = (t: Token) =>
    t.type === "openParen" ||
    t.type === "constant" ||
    (t.type === "unary" && (t.value === "sqrt" || t.value === "reciprocal"));
  for (let i = 0; i < tokens.length; i++) {
    const prev = out[out.length - 1];
    const curr = tokens[i];
    if (prev != null && leftCanMultiply(prev) && rightNeedsMultiply(curr)) {
      out.push({ type: "op", value: "*" });
    }
    out.push(curr);
  }
  return out;
}

/**
 * Застосування %: патерн "A op B %" замінюється на один результат.
 * A op B% = A op (B% від A). Приклад: 1000 - 5% → 950.
 */
function resolvePercent(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "percent") {
      out.push(tokens[i]);
      continue;
    }
    const b = out.pop();
    const opTok = out.pop();
    const a = out.pop();
    if (
      a?.type === "number" &&
      opTok?.type === "op" &&
      b?.type === "number"
    ) {
      const pct = b.value / 100;
      let resolved: number;
      if (opTok.value === "+") resolved = a.value + a.value * pct;
      else if (opTok.value === "-") resolved = a.value - a.value * pct;
      else if (opTok.value === "*") resolved = a.value * pct;
      else if (opTok.value === "/") resolved = pct === 0 ? NaN : a.value / pct;
      else resolved = a.value ** b.value;
      out.push({ type: "number", value: Number.isFinite(resolved) ? resolved : NaN });
    } else {
      if (a !== undefined) out.push(a);
      if (opTok !== undefined) out.push(opTok);
      if (b?.type === "number") out.push({ type: "number", value: b.value / 100 });
    }
  }
  return out;
}

/** Обчислення унарної операції */
function applyUnary(u: Token & { type: "unary" }, value: number): number {
  if (u.value === "sqrt") return value < 0 ? NaN : Math.sqrt(value);
  if (u.value === "square") return value * value;
  if (u.value === "reciprocal") return value === 0 ? NaN : 1 / value;
  if (u.value === "negate") return -value;
  return value;
}

/** Константа → число */
function constantValue(c: Token & { type: "constant" }): number {
  return c.value === "pi" ? Math.PI : Math.E;
}

/**
 * Shunting yard: токени (після resolvePercent) → RPN, потім обчислення.
 * Унарні √, ², 1/, − обробляються як префікс/постфікс при побудові RPN.
 * Повертає NaN при незбалансованих дужках або невалідному виразі.
 */
export function evaluate(tokens: Token[]): number {
  const withPercent = resolvePercent(tokens);
  const rpn: Token[] = [];
  const opStack: Token[] = [];
  const unaryStack: (Token & { type: "unary" })[] = [];
  let parenDepth = 0;

  function flushUnary() {
    while (unaryStack.length > 0 && rpn.length > 0) {
      const last = rpn[rpn.length - 1];
      if (last.type !== "number") break;
      const u = unaryStack.pop()!;
      rpn[rpn.length - 1] = { type: "number", value: applyUnary(u, last.value) };
    }
  }

  function flushOps(untilOpenParen?: boolean) {
    while (opStack.length > 0) {
      const top = opStack[opStack.length - 1];
      if (top.type === "openParen") {
        if (untilOpenParen) opStack.pop();
        break;
      }
      if (top.type !== "op") break;
      opStack.pop();
      rpn.push(top);
    }
  }

  let expectUnary = true; // Reserved for future unary-minus handling
  for (let i = 0; i < withPercent.length; i++) {
    const t = withPercent[i];
    if (t.type === "number") {
      rpn.push(t);
      flushUnary();
      expectUnary = false;
      continue;
    }
    if (t.type === "constant") {
      rpn.push({ type: "number", value: constantValue(t) });
      flushUnary();
      expectUnary = false;
      continue;
    }
    if (t.type === "unary") {
      if (t.value === "negate") {
        unaryStack.push(t);
        expectUnary = true;
        continue;
      }
      if (t.value === "sqrt" || t.value === "reciprocal") {
        unaryStack.push(t);
        expectUnary = true;
        continue;
      }
      if (t.value === "square") {
        const last = rpn[rpn.length - 1];
        if (last?.type === "number") {
          rpn[rpn.length - 1] = { type: "number", value: applyUnary(t, last.value) };
        }
        continue;
      }
      continue;
    }
    if (t.type === "openParen") {
      parenDepth++;
      opStack.push(t);
      expectUnary = true;
      continue;
    }
    if (t.type === "closeParen") {
      if (parenDepth <= 0) return NaN;
      parenDepth--;
      flushUnary();
      flushOps(true);
      expectUnary = false;
      continue;
    }
    if (t.type === "op") {
      flushUnary();
      const prio = OP_PRIORITY[t.value] ?? 0;
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1].type === "op" &&
        (OP_PRIORITY[(opStack[opStack.length - 1] as { value: string }).value] ?? 0) >= prio
      ) {
        rpn.push(opStack.pop()!);
      }
      opStack.push(t);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for unary-minus
      expectUnary = t.value === "-";
      continue;
    }
  }

  flushUnary();
  flushOps();

  if (parenDepth !== 0) return NaN;

  const stack: number[] = [];
  for (const t of rpn) {
    if (t.type === "number") {
      stack.push(t.value);
      continue;
    }
    if (t.type === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      if (t.value === "+") stack.push(a + b);
      else if (t.value === "-") stack.push(a - b);
      else if (t.value === "*") stack.push(a * b);
      else if (t.value === "/") stack.push(b === 0 ? NaN : a / b);
      else if (t.value === "^") stack.push(a ** b);
    }
  }

  if (stack.length !== 1) return NaN;
  const result = stack[0];
  return Number.isFinite(result) ? result : NaN;
}

/**
 * Обчислює рядок виразу. Повертає число або NaN при помилці.
 * Підтримує неявне множення: 25(6-9), 9√9 тощо.
 * Перед обчисленням автоматично дописує закриваючі дужки, якщо є незакриті (наприклад √(9 → √(9)).
 */
export function evaluateExpression(expr: string): number {
  if (!expr.trim()) return NaN;
  const balanced = balanceParentheses(expr);
  const tokens = insertImplicitMultiplication(tokenize(balanced));
  return evaluate(tokens);
}

/**
 * Повертає "поточне число" з кінця виразу для відображення (останній набраний number або 0).
 * Використовує лише tokenize (без insertImplicitMultiplication) — для відображення поточного вводу.
 */
export function getDisplayFromExpression(expr: string): string {
  const s = normalizeInput(expr).trim();
  if (!s) return "0";
  const tokens = tokenize(expr);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const tok = tokens[i];
    if (tok.type === "number") return formatNumber(tok.value);
    if (tok.type === "constant") return formatNumber(tok.value === "pi" ? Math.PI : Math.E);
  }
  return "0";
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) {
    const s = n.toExponential(4);
    return s.includes(".") ? s.replace(".", ",") : s;
  }
  const s = String(n);
  return s.includes(".") ? s.replace(".", ",") : s;
}

/** Відображення виразу для UI: заміна * → ×, / → ÷, - → − */
export function formatExpressionForDisplay(expr: string): string {
  return expr
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/-/g, "−")
    .trim() || "\u00A0";
}

/**
 * Повертає індекси [start, end) останнього терму в нормалізованому рядку.
 * Терм — останнє число, константа або вираз у дужках.
 */
function getLastTermSpan(
  normalized: string,
  tokens: TokenWithSpan[]
): { start: number; end: number } | null {
  if (tokens.length === 0) return null;
  const last = tokens[tokens.length - 1];
  if (last.type === "number" || last.type === "constant") {
    return { start: last.start, end: last.end };
  }
  if (last.type === "closeParen") {
    let depth = 1;
    let j = tokens.length - 2;
    while (j >= 0 && depth > 0) {
      if (tokens[j].type === "closeParen") depth++;
      else if (tokens[j].type === "openParen") depth--;
      j--;
    }
    if (j < 0) return null;
    return {
      start: (tokens[j] as TokenWithSpan).start,
      end: (last as TokenWithSpan).end,
    };
  }
  return null;
}

/**
 * Замінює останній терм у виразі на протилежне число (toggle знаку).
 * Обчислює значення останнього терму → заперечує → підставляє рядок. Стабільно працює незалежно від форми запису.
 * Приклад: "3" → "(-3)", "(-3)" → "3", "2+3" → "2+(-3)" або "2+3" → "2+(-3)" при застосуванні до останнього терму.
 */
export function replaceLastTermWithNegated(expr: string): string | null {
  const s = normalizeInput(expr).trim();
  if (!s) return null;
  const tokens = tokenizeWithSpans(expr);
  const span = getLastTermSpan(s, tokens);
  if (!span) return null;
  const termStr = s.slice(span.start, span.end);
  const value = evaluateExpression(termStr);
  if (!Number.isFinite(value)) return null;
  const newValue = -value;
  const newStr =
    newValue < 0 ? `(-${formatNumber(-newValue)})` : formatNumber(newValue);
  return s.slice(0, span.start) + newStr + s.slice(span.end);
}

/**
 * Замінює останній терм у виразі на обернений дріб (1/терм).
 * Приклад: "6" → "1/(6)", "6+9" → "6+1/(9)".
 * Повертає null, якщо немає терму для заміни.
 */
export function replaceLastTermWithReciprocal(expr: string): string | null {
  const s = normalizeInput(expr).trim();
  if (!s) return null;
  const tokens = tokenizeWithSpans(expr);
  const span = getLastTermSpan(s, tokens);
  if (!span) return null;
  const termStr = s.slice(span.start, span.end);
  return s.slice(0, span.start) + "1/(" + termStr + ")" + s.slice(span.end);
}
