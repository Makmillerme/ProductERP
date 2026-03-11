"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TextInputProps = {
  value: string | number | null | undefined;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  unit?: string | null;
  compact?: boolean;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  error?: string;
  pattern?: string;
  patternMessage?: string;
};

export function TextInput({
  value,
  onChange,
  disabled,
  label,
  placeholder,
  unit,
  compact,
  minLength,
  maxLength,
  required,
  error,
  pattern,
  patternMessage,
}: TextInputProps) {
  return (
    <div className="grid gap-1">
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
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        pattern={pattern}
        title={patternMessage}
        aria-invalid={!!error}
        aria-describedby={error ? "text-input-error" : undefined}
        className={cn(compact && "min-w-0", error && "border-destructive")}
      />
      {error && (
        <p id="text-input-error" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
