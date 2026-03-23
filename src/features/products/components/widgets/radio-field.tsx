"use client";

import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/locale-provider";
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
  /** Макет опцій: ряд (flex-wrap) або стовпець (flex-col). За замовчуванням — ряд. */
  layout?: "row" | "column";
};

export function RadioField({
  value,
  options,
  onChange,
  disabled,
  label,
  name,
  compact,
  layout = "row",
}: RadioFieldProps) {
  const { t } = useLocale();
  if (options.length === 0) {
    return (
      <div className="grid gap-1.5">
        <Label
          className={cn(
            compact && "text-xs font-normal text-muted-foreground",
          )}
        >
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{t("dynamicField.configureOptions")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
      </Label>
      <div className={cn(layout === "column" ? "flex flex-col gap-1.5" : "grid grid-cols-3 gap-x-4 gap-y-1.5 justify-items-center")}>
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
