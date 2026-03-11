"use client";

import { useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseDateValue,
  formatDateForStorage,
} from "../../lib/field-utils";

type DateFieldProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  compact?: boolean;
  /** date — тільки дата (YYYY-MM-DD), datetime — дата + час (ISO). */
  mode?: "date" | "datetime";
  required?: boolean;
};

export function DateField({
  value,
  onChange,
  disabled,
  label,
  placeholder = "Оберіть дату",
  compact,
  mode = "date",
  required,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const dateValue = parseDateValue(value);

  const displayFormat = mode === "datetime" ? "d MMMM yyyy, HH:mm" : "d MMMM yyyy";
  const timeValue = dateValue ? format(dateValue, "HH:mm") : "";

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) {
      onChange(null);
      setOpen(false);
      return;
    }
    if (mode === "datetime") {
      const merged = dateValue
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), dateValue.getHours(), dateValue.getMinutes())
        : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0);
      onChange(formatDateForStorage(merged, "datetime"));
    } else {
      onChange(formatDateForStorage(d, "date"));
      setOpen(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value;
    if (!timeStr) {
      if (dateValue) {
        const d = new Date(dateValue);
        d.setHours(0, 0, 0, 0);
        onChange(formatDateForStorage(d, "datetime"));
      }
      return;
    }
    const [h, m] = timeStr.split(":").map(Number);
    const base = dateValue ?? new Date();
    const merged = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    onChange(formatDateForStorage(merged, "datetime"));
  };

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
      <div className={cn("flex gap-2", mode === "datetime" && "flex-wrap")}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex-1 min-w-0 justify-start text-left font-normal",
                !value && "text-muted-foreground",
                compact && "min-w-0",
              )}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0" />
              {dateValue
                ? format(dateValue, displayFormat, { locale: uk })
                : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="max-h-[min(85dvh,22rem)] w-auto overflow-y-auto p-0"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            avoidCollisions
          >
            <Calendar
              mode="single"
              locale={uk}
              selected={dateValue}
              onSelect={handleDateSelect}
              initialFocus
            />
            {mode === "datetime" && (
              <div className="p-3 border-t">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Час
                </Label>
                <Input
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                  disabled={disabled}
                  className="w-full"
                />
              </div>
            )}
          </PopoverContent>
        </Popover>
        {mode === "datetime" && (
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className="w-[7rem] shrink-0"
            aria-label="Час"
          />
        )}
      </div>
    </div>
  );
}
