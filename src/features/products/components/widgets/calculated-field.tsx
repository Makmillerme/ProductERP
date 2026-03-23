"use client";

import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-provider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { evaluateFormula } from "../../lib/field-utils";

type CalculatedFieldProps = {
  formula: string | null;
  product: Record<string, unknown>;
  label: string;
  unit?: string | null;
  placeholder?: string;
  compact?: boolean;
};

export function CalculatedField({
  formula,
  product,
  label,
  unit,
  placeholder,
  compact,
}: CalculatedFieldProps) {
  const { t } = useLocale();
  const resolvedPlaceholder = placeholder ?? t("dynamicField.formulaPlaceholder");
  const result = evaluateFormula(formula, product);

  return (
    <div className="grid gap-2">
      <Label
        className={cn(
          compact && "text-xs font-normal text-muted-foreground",
        )}
      >
        {label}
        {unit ? ` (${unit})` : ""}
      </Label>
      <Input
        value={result ?? ""}
        disabled
        readOnly
        placeholder={formula ? "--" : resolvedPlaceholder}
        className={cn("bg-muted", compact && "min-w-0")}
      />
    </div>
  );
}
