"use client";

import { Label } from "@/components/ui/label";
import type { SelectOption } from "../../lib/field-utils";
import { cn } from "@/lib/utils";

type MultiselectFieldProps = {
  value: string;
  options: SelectOption[];
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  compact?: boolean;
};

export function MultiselectField({
  value,
  options,
  onChange,
  disabled,
  label,
  compact,
}: MultiselectFieldProps) {
  if (options.length === 0) {
    return (
      <div className="grid gap-1">
        <Label
          className={cn(
            compact && "text-xs font-normal text-muted-foreground",
          )}
        >
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">Налаштуйте опції в конфігурації поля</p>
      </div>
    );
  }

  const arr = value.trim()
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggle = (v: string) => {
    const next = arr.includes(v)
      ? arr.filter((x) => x !== v)
      : [...arr, v];
    onChange(next.length ? next.join(",") : null);
  };

  return (
    <div className="grid gap-1">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
      </Label>
      <div className="flex flex-wrap gap-3">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={arr.includes(o.value)}
              onChange={() => toggle(o.value)}
              disabled={disabled}
              className="size-4"
            />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
