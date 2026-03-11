"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { evaluateFormula } from "../../lib/field-utils";

type CalculatedFieldProps = {
  formula: string | null;
  vehicle: Record<string, unknown>;
  label: string;
  unit?: string | null;
  placeholder?: string;
  compact?: boolean;
};

export function CalculatedField({
  formula,
  vehicle,
  label,
  unit,
  placeholder = "Вкажіть формулу в налаштуваннях поля",
  compact,
}: CalculatedFieldProps) {
  const result = evaluateFormula(formula, vehicle);

  return (
    <div className="grid gap-1">
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
        placeholder={formula ? "--" : placeholder}
        className={cn("bg-muted", compact && "min-w-0")}
      />
    </div>
  );
}
