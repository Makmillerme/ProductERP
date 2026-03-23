"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-provider";
import {
  computeGridLayout,
  getGridColSpan,
  type GridField,
} from "../lib/grid-layout";

type FieldGridEditorProps = {
  fields: GridField[];
  onClickAdd: () => void;
  onRemoveField?: (fieldDefinitionId: string) => void;
  disabled?: boolean;
  cols?: number;
};

const COL_SPAN_CLASS: Record<number, string> = {
  1: "",
  2: "sm:col-span-2",
  3: "col-span-full",
};

export function FieldGridEditor({
  fields,
  onClickAdd,
  onRemoveField,
  disabled,
  cols = 3,
}: FieldGridEditorProps) {
  const { t } = useLocale();
  const items = useMemo(() => computeGridLayout(fields, cols), [fields, cols]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      {items.map((item) => {
        if (item.type === "empty") {
          return (
            <button
              key={`empty-${item.row}-${item.col}`}
              type="button"
              onClick={onClickAdd}
              disabled={disabled}
              className={cn(
                "group flex min-h-[3rem] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20",
                "transition-colors hover:border-primary/40 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                disabled && "pointer-events-none opacity-40"
              )}
              title={t("productsConfig.tabsConfig.addFieldToTab")}
            >
              <Plus className="size-5 text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
            </button>
          );
        }

        const span = getGridColSpan(item.field.widgetType, item.field.colSpan, cols);
        const spanClass = COL_SPAN_CLASS[span] ?? "";

        return (
          <div
            key={`field-${item.field.fieldDefinitionId}`}
            className={cn(
              "group relative flex min-h-[3rem] items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm",
              spanClass
            )}
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium">{item.field.label}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                {t(`widgetTypesShort.${item.field.widgetType}`) ||
                  t(`widgetTypes.${item.field.widgetType}`) ||
                  item.field.widgetType}
              </span>
            </div>
            {onRemoveField && (
              <button
                type="button"
                onClick={() => onRemoveField(item.field.fieldDefinitionId)}
                disabled={disabled}
                className={cn(
                  "shrink-0 rounded-md p-1 text-muted-foreground/50 opacity-0 transition-opacity",
                  "hover:bg-destructive/10 hover:text-destructive",
                  "group-hover:opacity-100 focus-visible:opacity-100",
                  disabled && "pointer-events-none"
                )}
                title={t("users.delete")}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
