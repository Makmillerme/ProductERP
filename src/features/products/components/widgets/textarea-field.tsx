"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TextareaFieldProps = {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  rows?: number;
  compact?: boolean;
  minLength?: number;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  required?: boolean;
  error?: string;
};

export function TextareaField({
  value,
  onChange,
  disabled,
  label,
  placeholder,
  rows = 4,
  compact,
  minLength,
  maxLength,
  minRows,
  maxRows,
  required,
  error,
}: TextareaFieldProps) {
  const effectiveRows = minRows != null && maxRows != null
    ? Math.min(Math.max(rows, minRows), maxRows)
    : minRows != null ? Math.max(rows, minRows) : maxRows != null ? Math.min(rows, maxRows) : rows;
  return (
    <div className="grid gap-2">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        rows={compact ? 2 : effectiveRows}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? "textarea-error" : undefined}
        className={cn(
          compact && "min-w-0",
          !compact && "min-h-[80px] max-h-[200px] resize-y overflow-y-auto",
          error && "border-destructive",
        )}
      />
      {error && (
        <p id="textarea-error" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
