"use client";

import { Label } from "@/components/ui/label";
import type { SelectOption } from "../../lib/field-utils";
import { cn } from "@/lib/utils";

type RadioFieldProps = {
  value: string;
  options: SelectOption[];
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  name: string;
  compact?: boolean;
};

export function RadioField({
  value,
  options,
  onChange,
  disabled,
  label,
  name,
  compact,
}: RadioFieldProps) {
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
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
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
