"use client";

import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  evaluateFormula,
  extractFormulaSlugs,
  validateFormula,
} from "@/features/products/lib/field-utils";
import { useLocale } from "@/lib/locale-provider";

type NumericFieldItem = { code: string; label: string };

const RECENT_SLUGS_KEY = "formula-recent-slugs";
const RECENT_MAX = 5;
const INLINE_MAX = 6;

function loadRecentSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(RECENT_SLUGS_KEY);
    return s ? (JSON.parse(s) as string[]).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecentSlug(code: string) {
  const prev = loadRecentSlugs();
  const next = [code, ...prev.filter((c) => c !== code)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_SLUGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function sortByRecent<T extends { code: string }>(
  items: T[],
  recentCodes: string[]
): T[] {
  return [...items].sort((a, b) => {
    const aIdx = recentCodes.indexOf(a.code);
    const bIdx = recentCodes.indexOf(b.code);
    if (aIdx >= 0 && bIdx < 0) return -1;
    if (aIdx < 0 && bIdx >= 0) return 1;
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    return 0;
  });
}

type FormulaEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** Список числових полів для підказок (fieldDefinitions або subFields composite) */
  numericFields: NumericFieldItem[];
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Компактний стиль для composite subfields */
  size?: "default" | "sm";
};

export function FormulaEditor({
  value,
  onChange,
  numericFields,
  disabled,
  id = "fd-formula",
  className,
  size = "default",
}: FormulaEditorProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertSearch, setInsertSearch] = useState("");
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineAnchor, setInlineAnchor] = useState<{ start: number; partial: string } | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>(loadRecentSlugs);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (insertOpen) {
      setInsertSearch("");
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [insertOpen]);

  const filteredForInsert = useMemo(() => {
    const q = insertSearch.trim().toLowerCase();
    if (!q) return numericFields;
    return numericFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    );
  }, [numericFields, insertSearch]);

  const inlineMatches = useMemo(() => {
    const partial = inlineAnchor?.partial ?? "";
    const q = partial.toLowerCase();
    if (!q) {
      const recent = numericFields.filter((f) => recentSlugs.includes(f.code));
      return recent.slice(0, RECENT_MAX);
    }
    const filtered = numericFields.filter(
      (f) =>
        f.code.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
    return sortByRecent(filtered, recentSlugs).slice(0, INLINE_MAX);
  }, [numericFields, inlineAnchor?.partial, recentSlugs]);

  const insertAtCursor = useCallback(
    (code: string) => {
      saveRecentSlug(code);
      setRecentSlugs(loadRecentSlugs());
      const input = inputRef.current;
      const inserted = `{${code}}`;
      if (!input) {
        onChange(value + inserted);
        setInlineOpen(false);
        return;
      }
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      if (inlineAnchor) {
        const before = value.slice(0, inlineAnchor.start);
        const after = value.slice(end);
        onChange(before + inserted + after);
        setInlineOpen(false);
        setInlineAnchor(null);
        requestAnimationFrame(() => {
          input.focus();
          const newPos = before.length + inserted.length;
          input.setSelectionRange(newPos, newPos);
        });
      } else {
        const before = value.slice(0, start);
        const after = value.slice(end);
        onChange(before + inserted + after);
        setInsertOpen(false);
        requestAnimationFrame(() => {
          input.focus();
          const newPos = start + inserted.length;
          input.setSelectionRange(newPos, newPos);
        });
      }
    },
    [value, onChange, inlineAnchor]
  );

  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      const input = e.target;
      const pos = input.selectionStart ?? v.length;
      const beforeCursor = v.slice(0, pos);
      const lastBrace = beforeCursor.lastIndexOf("{");
      if (lastBrace >= 0) {
        const partial = beforeCursor.slice(lastBrace + 1);
        const hasClosing = partial.includes("}");
        if (!hasClosing && /^\w*$/.test(partial)) {
          setInlineAnchor({ start: lastBrace, partial });
          setInlineOpen(true);
        } else {
          setInlineOpen(false);
          setInlineAnchor(null);
        }
      } else {
        setInlineOpen(false);
        setInlineAnchor(null);
      }
    },
    [onChange]
  );

  const handleFormulaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && inlineOpen) {
        setInlineOpen(false);
        setInlineAnchor(null);
      }
    },
    [inlineOpen]
  );

  const testVehicle = Object.fromEntries(
    extractFormulaSlugs(value).map((s) => [s, 1])
  );
  const previewResult = value.trim()
    ? evaluateFormula(value.trim(), testVehicle)
    : null;
  const formulaError = value.trim() ? validateFormula(value.trim()) : null;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{t("fieldSettings.formula")}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("formulaEditor.ariaNumericFields")}
            >
              <Info className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-[280px] max-h-[240px] overflow-y-auto p-2"
          >
            <p className="mb-2 font-medium">
              {t("formulaEditor.fieldCodeHeader")}
            </p>
            <ul className="space-y-1 text-left">
              {numericFields.length === 0 ? (
                <li className="text-muted-foreground">{t("formulaEditor.noFieldsAvailable")}</li>
              ) : (
                sortByRecent(numericFields, recentSlugs)
                  .slice(0, 6)
                  .map((f, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">{f.label}</span>
                    <code className="shrink-0 font-mono text-[10px]">
                      {"{"}
                      {f.code}
                      {"}"}
                    </code>
                  </li>
                ))
              )}
              {numericFields.length > 6 && (
                <li className="text-muted-foreground text-[10px] pt-1">
                  +{numericFields.length - 6} {t("formulaEditor.moreFieldsHint")}
                </li>
              )}
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="relative flex gap-2">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={handleFormulaChange}
          onKeyDown={handleFormulaKeyDown}
          placeholder={t("formulaEditor.placeholder")}
          disabled={disabled}
          className={cn(
            "font-mono flex-1",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        />
        {inlineOpen && (
          <div
            className="absolute left-0 right-9 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover py-1 shadow-md"
            style={{ minWidth: "12rem" }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {inlineMatches.length > 0 ? (
              inlineMatches.map((f, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted flex items-center justify-between gap-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertAtCursor(f.code);
                }}
              >
                <span className="truncate">{f.label}</span>
                <code className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {f.code}
                </code>
              </button>
            ))
            ) : (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {inlineAnchor?.partial
                  ? t("formulaEditor.nothingFound")
                  : t("formulaEditor.enterCodeToSearch")}
              </p>
            )}
          </div>
        )}
        <Popover open={insertOpen} onOpenChange={setInsertOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled || numericFields.length === 0}
              className="shrink-0"
              aria-label={t("formulaEditor.ariaInsertField")}
            >
              <Plus className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {t("formulaEditor.selectFieldOrSearch")}
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={insertSearch}
                onChange={(e) => setInsertSearch(e.target.value)}
                placeholder={t("formulaEditor.searchPlaceholder")}
                className="h-8 pl-7 text-xs"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredForInsert.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {t("formulaEditor.nothingFound")}
                </p>
              ) : (
                filteredForInsert.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted flex items-center justify-between gap-2"
                    onClick={() => insertAtCursor(f.code)}
                  >
                    <span className="truncate">{f.label}</span>
                    <code className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {f.code}
                    </code>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {value.trim() && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {formulaError ? (
            <span className="text-destructive">{formulaError}</span>
          ) : previewResult != null ? (
            <span className="text-muted-foreground">
              {t("formulaEditor.validationPreview")}{" "}
              <strong className="text-foreground font-mono">{previewResult}</strong>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
