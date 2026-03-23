"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { parsePresetValues } from "@/features/products/lib/field-utils";
import type { SelectOption } from "@/features/products/lib/field-utils";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-provider";
import type { DataType } from "@/config/field-constructor";

function optionsToJson(opts: SelectOption[]): string {
  if (opts.length === 0) return "";
  return JSON.stringify(opts, null, 0);
}

function validateOptionValue(
  value: string,
  dataType: DataType,
  t: (key: string) => string
): string | null {
  const v = value.trim();
  if (!v) return t("optionsEditor.valueCannotBeEmpty");
  if (dataType === "string") return null;
  if (dataType === "integer") {
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || String(n) !== v) return t("optionsEditor.mustBeInteger");
    return null;
  }
  if (dataType === "float") {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return t("optionsEditor.mustBeFloat");
    return null;
  }
  if (dataType === "boolean") {
    if (v !== "true" && v !== "false") return t("optionsEditor.mustBeBoolean");
    return null;
  }
  return null;
}

type OptionsEditorProps = {
  value: string;
  onChange: (json: string) => void;
  dataType?: DataType;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
};

export function OptionsEditor({
  value,
  onChange,
  dataType = "string",
  disabled,
  placeholder,
  compact,
}: OptionsEditorProps) {
  const { t } = useLocale();
  const [labelInput, setLabelInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const options = parsePresetValues(value || null);
  const resolvedPlaceholder = placeholder ?? t("optionsEditor.optionNamePlaceholder");

  const isValueOnly = dataType === "integer" || dataType === "float";

  const addOption = useCallback(() => {
    setError(null);
    let valueStr: string;
    let labelStr: string;

    if (isValueOnly) {
      const v = valueInput.trim();
      if (!v) {
        setError(t("optionsEditor.specifyOptionValue"));
        return;
      }
      const err = validateOptionValue(v, dataType, t);
      if (err) {
        setError(err);
        return;
      }
      valueStr = v;
      labelStr = v;
    } else {
      const label = labelInput.trim();
      if (!label) {
        setError(t("optionsEditor.specifyOptionLabel"));
        return;
      }
      valueStr = slugify(label) || `opt_${Date.now()}`;
      labelStr = label;
    }

    const used = new Set(options.map((o) => o.value));
    let finalValue = valueStr;
    if (used.has(valueStr)) {
      if (isValueOnly) {
        setError(t("optionsEditor.optionAlreadyExists"));
        return;
      }
      let suffix = 0;
      while (used.has(finalValue)) {
        suffix += 1;
        finalValue = `${slugify(labelStr) || "opt"}_${suffix}`;
      }
    }

    const next = [...options, { value: finalValue, label: labelStr }];
    onChange(optionsToJson(next));
    setLabelInput("");
    setValueInput("");
  }, [labelInput, valueInput, options, onChange, dataType, isValueOnly, t]);

  const removeOption = useCallback(
    (index: number) => {
      const next = options.filter((_, i) => i !== index);
      onChange(optionsToJson(next));
      setError(null);
    },
    [options, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <div className={cn("grid gap-2", compact && "gap-1.5")}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          {!isValueOnly && (
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={resolvedPlaceholder}
              disabled={disabled}
              className={cn(compact && "h-8 text-xs")}
            />
          )}
          {isValueOnly && (
            <Input
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                dataType === "integer"
                  ? t("optionsEditor.valuePlaceholderInteger")
                  : t("optionsEditor.valuePlaceholderFloat")
              }
              disabled={disabled}
              className={cn(compact && "h-8 text-xs")}
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addOption}
          disabled={
            disabled ||
            (isValueOnly ? !valueInput.trim() : !labelInput.trim())
          }
          className={cn("shrink-0", compact && "h-8 w-8")}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt, i) => (
            <Badge
              key={`${opt.value}-${i}`}
              variant="secondary"
              className={cn(
                "gap-1 pr-1",
                compact && "text-[10px] py-0 px-1.5"
              )}
            >
              <span className="truncate max-w-[8rem]">{opt.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={t("optionsEditor.ariaDelete")}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
