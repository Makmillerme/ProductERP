"use client";

import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/locale-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectOption } from "../../lib/field-utils";
import { cn } from "@/lib/utils";

type SelectFieldProps = {
  value: string;
  options: SelectOption[];
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  compact?: boolean;
};

export function SelectField({
  value,
  options,
  onChange,
  disabled,
  label,
  placeholder,
  compact,
}: SelectFieldProps) {
  const { t } = useLocale();
  const resolvedPlaceholder = placeholder ?? t("dynamicField.selectPlaceholder");
  const opts =
    value && !options.some((o) => o.value === value)
      ? [...options, { value, label: value }]
      : options;

  if (opts.length === 0) {
    const unconfigured = "__unconfigured__";
    return (
      <div
        className={cn(
          "grid min-w-0 w-full max-w-full gap-2",
        )}
      >
        <Label
          className={cn(
            compact && "text-xs font-normal text-muted-foreground",
          )}
        >
          {label}
        </Label>
        <Select value={unconfigured} onValueChange={() => {}}>
          <SelectTrigger
            className={cn(
              compact && "min-w-0",
              "w-full min-w-0 max-w-full overflow-hidden [&>span]:truncate",
            )}
          >
            <SelectValue placeholder={t("dynamicField.configureOptions")} />
          </SelectTrigger>
          <SelectContent className="max-w-[min(var(--radix-select-trigger-width),100%)]">
            <SelectItem
              value={unconfigured}
              className="whitespace-normal text-muted-foreground focus:text-muted-foreground"
            >
              {t("dynamicField.configureOptions")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 w-full max-w-full gap-2">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v || null)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            compact && "min-w-0",
            "w-full min-w-0 max-w-full overflow-hidden [&>span]:truncate",
          )}
        >
          <SelectValue placeholder={resolvedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
