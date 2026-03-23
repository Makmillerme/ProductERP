"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type NumberInputProps = {
  value: string | number | null | undefined;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  unit?: string | null;
  dataType?: "integer" | "float";
  compact?: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  useThousandSeparator?: boolean;
  required?: boolean;
  error?: string;
};

function formatDisplayValue(
  v: string | number | null | undefined,
  decimalPlaces?: number,
  useThousandSeparator?: boolean
): string {
  if (v === null || v === undefined || v === "") return "";
  const num = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(num)) return String(v);
  let s: string;
  if (decimalPlaces != null && decimalPlaces >= 0) {
    s = num.toFixed(decimalPlaces);
  } else {
    s = String(num);
  }
  if (useThousandSeparator && /^-?\d+\.?\d*$/.test(s)) {
    const [int, dec] = s.split(".");
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    s = dec != null ? `${withSep},${dec}` : withSep;
  }
  return s;
}

function parseInputValue(
  s: string,
  decimalPlaces?: number,
  useThousandSeparator?: boolean
): number | null {
  if (!s.trim()) return null;
  const normalized = useThousandSeparator
    ? s.replace(/\s/g, "").replace(",", ".")
    : s.replace(",", ".");
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return null;
  return decimalPlaces != null && decimalPlaces >= 0
    ? Number(num.toFixed(decimalPlaces))
    : num;
}

export function NumberInput({
  value,
  onChange,
  disabled,
  label,
  placeholder,
  unit,
  dataType = "float",
  compact,
  min,
  max,
  step,
  decimalPlaces,
  useThousandSeparator = false,
  required,
  error,
}: NumberInputProps) {
  const isInteger = dataType === "integer";
  const stepAttr = step ?? (isInteger ? 1 : undefined);
  const htmlStep = stepAttr != null ? String(stepAttr) : isInteger ? "1" : "any";

  const displayValue =
    useThousandSeparator || decimalPlaces != null
      ? formatDisplayValue(value, decimalPlaces, useThousandSeparator)
      : String(value ?? "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (useThousandSeparator || decimalPlaces != null) {
      const parsed = parseInputValue(v, decimalPlaces, useThousandSeparator);
      onChange(parsed);
    } else {
      const parsed =
        v === "" ? null : (isInteger ? parseInt(v, 10) : parseFloat(v));
      const next =
        parsed != null && !Number.isNaN(parsed) ? parsed : null;
      onChange(next);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (useThousandSeparator || decimalPlaces != null) {
      const v = e.target.value;
      if (v.trim()) {
        const parsed = parseInputValue(v, decimalPlaces, useThousandSeparator);
        if (parsed != null) onChange(parsed);
      }
    }
  };

  const showError = error;

  return (
    <div className="grid gap-2">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
        {unit ? ` (${unit})` : ""}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        type={useThousandSeparator ? "text" : "number"}
        inputMode={useThousandSeparator ? "decimal" : undefined}
        step={htmlStep}
        min={min}
        max={max}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!showError}
        aria-describedby={showError ? "number-error" : undefined}
        className={cn(compact && "min-w-0", showError && "border-destructive")}
      />
      {showError && (
        <p id="number-error" className="text-xs text-destructive">
          {showError}
        </p>
      )}
    </div>
  );
}
