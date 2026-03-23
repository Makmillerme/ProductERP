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
    return (
      <div className="grid gap-2">
        <Label
          className={cn(
            compact && "text-xs font-normal text-muted-foreground",
          )}
        >
          {label}
        </Label>
        <Select value="" disabled>
          <SelectTrigger className={cn(compact && "min-w-0", "w-full")}>
            <SelectValue placeholder={t("dynamicField.configureOptions")} />
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
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
        <SelectTrigger className={cn(compact && "min-w-0", "w-full")}>
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
