"use client";

/**
 * Калькулятор (floating, портал у body).
 * Модель: один рядок виразу (expression), користувач набирає вираз і натискає "=" для обчислення.
 * Парсинг і обчислення в calculator-expression.ts (токенайзер + Shunting yard).
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  evaluateExpression,
  balanceParentheses,
  getDisplayFromExpression,
  formatNumber,
  formatExpressionForDisplay,
  replaceLastTermWithNegated,
  replaceLastTermWithReciprocal,
} from "./calculator-expression";

type CalculatorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function IconDivide() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconMultiply() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEquals() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  );
}

function IconBackspace() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="m10 11 4 4M14 11l-4 4" />
    </svg>
  );
}

export function CalculatorDialog({ open, onOpenChange }: CalculatorDialogProps) {
  const [expression, setExpression] = useState("");
  const [, setDisplay] = useState("0");
  const [resultLine, setResultLine] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [calcError, setCalcError] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const hasDragged = useRef(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const skipSyncRef = useRef(false);
  const expressionRef = useRef("");
  const handlersRef = useRef<{
    handleDigit: (d: string) => void;
    handleOp: (op: "+" | "-" | "*" | "/" | "^") => void;
    handleEquals: () => void;
    handleClear: () => void;
    handleBackspace: () => void;
    handleOpenParen: () => void;
    handleCloseParen: () => void;
  } | null>(null);

  expressionRef.current = expression;

  useEffect(() => {
    if (!open) {
      hasDragged.current = false;
      setPosition({ x: 0, y: 0 });
      setExpression("");
      setDisplay("0");
      setResultLine("");
      setResultValue("");
      setCalcError(false);
    }
  }, [open]);

  const clearResult = useCallback(() => {
    setResultLine("");
    setResultValue("");
    setCalcError(false);
  }, []);

  const syncDisplayFromExpression = useCallback(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setDisplay((prev) => {
      const next = getDisplayFromExpression(expression);
      return next !== prev ? next : prev;
    });
  }, [expression]);

  useEffect(() => {
    syncDisplayFromExpression();
  }, [expression, syncDisplayFromExpression]);

  const append = useCallback((s: string) => {
    clearResult();
    setExpression((e) => e + s);
  }, [clearResult]);

  const handleDigit = useCallback(
    (d: string) => {
      append(d === "," ? "," : d);
    },
    [append]
  );

  const handleOp = useCallback(
    (op: "+" | "-" | "*" | "/" | "^") => {
      append(op);
    },
    [append]
  );

  const handleEquals = useCallback(() => {
    const expr = expressionRef.current.trim();
    if (!expr) return;
    const balanced = balanceParentheses(expr);
    const result = evaluateExpression(expr);
    if (!Number.isFinite(result)) {
      setDisplay("0");
      setExpression("");
      clearResult();
      setCalcError(true);
      return;
    }
    skipSyncRef.current = true;
    const formatted = formatNumber(result);
    setResultLine(balanced);
    setResultValue(formatted);
    setDisplay(formatted);
    setExpression(formatted);
    setCalcError(false);
  }, [clearResult]);

  const handleClear = useCallback(() => {
    setExpression("");
    setDisplay("0");
    clearResult();
  }, [clearResult]);

  const handleBackspace = useCallback(() => {
    clearResult();
    setExpression((e) => {
      if (e.length <= 1) return "";
      return e.slice(0, -1);
    });
  }, [clearResult]);

  const handlePercent = useCallback(() => {
    append("%");
  }, [append]);

  /** √ — додати "√(" у вираз; користувач далі вводить число і ")". */
  const handleSqrt = useCallback(() => {
    clearResult();
    append("√(");
  }, [append, clearResult]);

  /** x² — додати "²" як постфікс до останнього числа у виразі. */
  const handleSquare = useCallback(() => {
    clearResult();
    append("²");
  }, [append, clearResult]);

  /** 1/x — замінити останній терм на обернений дріб: "6" → "1/(6)", "6+9" → "6+1/(9)". */
  const handleReciprocal = useCallback(() => {
    setExpression((expr) => {
      const next = replaceLastTermWithReciprocal(expr);
      return next ?? expr;
    });
    clearResult();
  }, [clearResult]);

  /** +/− — змінити знак саме останнього числа/терму; повторний клік повертає знак. */
  const handleNegate = useCallback(() => {
    setExpression((expr) => {
      const next = replaceLastTermWithNegated(expr.trim());
      if (next == null) return expr;
      return next;
    });
    clearResult();
  }, [clearResult]);

  const handleOpenParen = useCallback(() => append("("), [append]);
  const handleCloseParen = useCallback(() => append(")"), [append]);
  const insertConstant = useCallback(
    (value: number, label: string) => {
      skipSyncRef.current = true;
      clearResult();
      append(label);
      setDisplay(formatNumber(value));
    },
    [append, clearResult]
  );

  handlersRef.current = {
    handleDigit,
    handleOp,
    handleEquals,
    handleClear,
    handleBackspace,
    handleOpenParen,
    handleCloseParen,
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.("input") || target.closest?.("textarea")) return;
      const h = handlersRef.current;
      if (!h) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        h.handleDigit(e.key);
        return;
      }
      if (e.key === "," || e.key === ".") {
        e.preventDefault();
        h.handleDigit(",");
        return;
      }
      if (e.key === "+") {
        e.preventDefault();
        h.handleOp("+");
        return;
      }
      if (e.key === "-") {
        e.preventDefault();
        h.handleOp("-");
        return;
      }
      if (e.key === "*") {
        e.preventDefault();
        h.handleOp("*");
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        h.handleOp("/");
        return;
      }
      if (e.key === "^") {
        e.preventDefault();
        h.handleOp("^");
        return;
      }
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        h.handleEquals();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        h.handleClear();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        h.handleBackspace();
        return;
      }
      if (e.key === "(") {
        e.preventDefault();
        h.handleOpenParen();
        return;
      }
      if (e.key === ")") {
        e.preventDefault();
        h.handleCloseParen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = contentRef.current;
    const left = el ? el.getBoundingClientRect().left : 0;
    const top = el ? el.getBoundingClientRect().top : 0;
    hasDragged.current = true;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: left,
      startTop: top,
    };
  };

  const onDragMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    setPosition({
      x: dragRef.current.startLeft + e.clientX - dragRef.current.startX,
      y: dragRef.current.startTop + e.clientY - dragRef.current.startY,
    });
  };

  const onDragEnd = () => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  };

  const onDragStartCapture = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    onDragStart(e);
  };

  const isCentered = !hasDragged.current && position.x === 0 && position.y === 0;
  const showResult = resultValue !== "";
  const topLine = showResult ? formatExpressionForDisplay(resultLine) : "\u00A0";
  const mainLine = calcError
    ? "Помилка"
    : showResult
      ? resultValue
      : expression || "0";

  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    el.setAttribute("data-calculator-portal", "");
    el.style.cssText = "position:fixed;inset:0;z-index:99999;pointer-events:none";
    document.body.appendChild(el);
    setPortalTarget(el);
    return () => {
      el.remove();
      setPortalTarget(null);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  if (!portalTarget) return null;

  const calculatorEl = (
    <div
      ref={contentRef}
      data-calculator-root
      role="dialog"
      aria-modal="false"
      aria-label="Калькулятор"
      className="flex flex-col rounded-lg border bg-background shadow-lg overflow-hidden pointer-events-auto"
      style={{
        width: sidePanelOpen ? "min(100vw - 2rem, 24rem)" : "min(100vw - 2rem, 20rem)",
        ...(isCentered
          ? { position: "fixed" as const, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
          : { position: "fixed" as const, left: position.x, top: position.y, transform: "none" }),
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2 pr-10 relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onDragStartCapture}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidePanelOpen((v) => !v)}
            className="rounded-md p-1.5 opacity-70 hover:opacity-100 focus:ring-0 focus:outline-none"
            aria-label={sidePanelOpen ? "Закрити панель знаків" : "Відкрити панель знаків"}
            title={sidePanelOpen ? "Закрити панель" : "Додаткові знаки"}
          >
            {sidePanelOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>
          <span className="text-base font-semibold">Калькулятор</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-70 hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
          aria-label="Закрити"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 min-h-0">
        {sidePanelOpen && (
          <aside className="flex flex-col gap-1 border-r bg-muted/30 p-2 w-20 shrink-0">
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs" onClick={handleOpenParen} aria-label="Відкриваюча дужка">
              (
            </Button>
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs" onClick={handleCloseParen} aria-label="Закриваюча дужка">
              )
            </Button>
            <Button variant="outline" size="sm" className="h-8 font-mono" onClick={() => insertConstant(Math.PI, "π")} aria-label="Число π">
              π
            </Button>
            <Button variant="outline" size="sm" className="h-8 font-mono" onClick={() => insertConstant(Math.E, "e")} aria-label="Число e">
              e
            </Button>
          </aside>
        )}
        <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
          <div
            className="w-full rounded-md border bg-muted/50 px-3 py-2 text-right font-mono h-[4.5rem] flex flex-col justify-center overflow-hidden select-text cursor-text"
            aria-live="polite"
            title="Можна виділити та копіювати"
          >
            <div className="min-h-[1.25rem] text-sm text-muted-foreground tabular-nums overflow-hidden overflow-y-hidden whitespace-nowrap text-ellipsis">
              {topLine}
            </div>
            <div
              className="text-2xl tabular-nums overflow-hidden overflow-y-hidden whitespace-nowrap text-ellipsis"
            >
              {mainLine}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Button variant="outline" size="sm" className="h-9" onClick={handlePercent}>
              %
            </Button>
            <Button variant="outline" size="sm" className="h-9 font-mono" onClick={() => handleOp("^")} aria-label="Піднесення до степеня" title="Піднесення до степеня">
              x^y
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleClear}>
              C
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center justify-center" onClick={handleBackspace} aria-label="Стерти">
              <IconBackspace />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleReciprocal}>
              1/x
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleSquare}>
              x²
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleSqrt}>
              √x
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center justify-center" onClick={() => handleOp("/")} aria-label="Ділення">
              <IconDivide />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("7")}>
              7
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("8")}>
              8
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("9")}>
              9
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center justify-center" onClick={() => handleOp("*")} aria-label="Множення">
              <IconMultiply />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("4")}>
              4
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("5")}>
              5
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("6")}>
              6
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center justify-center" onClick={() => handleOp("-")} aria-label="Віднімання">
              <IconMinus />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("1")}>
              1
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("2")}>
              2
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("3")}>
              3
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center justify-center" onClick={() => handleOp("+")} aria-label="Додавання">
              <IconPlus />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleNegate}>
              +/−
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit("0")}>
              0
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => handleDigit(",")}>
              ,
            </Button>
            <Button variant="default" size="sm" className="h-9 flex items-center justify-center" onClick={handleEquals} aria-label="Дорівнює">
              <IconEquals />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(calculatorEl, portalTarget);
}
