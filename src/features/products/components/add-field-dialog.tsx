"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-provider";
import { SHEET_SCROLL_CLASS } from "@/config/sheet";

export type AddFieldItem = {
  id: string;
  code: string | null;
  label: string;
  widgetType: string;
  categoryIds?: string[];
  productTypeIds?: string[];
};

type GroupedFields = {
  currentCat: AddFieldItem[];
  global: AddFieldItem[];
  otherCats: AddFieldItem[];
};

type AddFieldDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectField: (field: AddFieldItem) => void;
  onRequestCreateField?: () => void;
  groupedFields: GroupedFields;
  loading?: boolean;
  disabled?: boolean;
  categoryName?: string;
  categoryNameById?: Map<string, string>;
};

export function AddFieldDialog({
  open,
  onOpenChange,
  onSelectField,
  onRequestCreateField,
  groupedFields,
  loading,
  disabled,
  categoryName,
  categoryNameById,
}: AddFieldDialogProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return groupedFields;
    const match = (f: AddFieldItem) =>
      f.label.toLowerCase().includes(q) ||
      (f.code ?? "").toLowerCase().includes(q) ||
      f.widgetType.toLowerCase().includes(q);
    return {
      currentCat: groupedFields.currentCat.filter(match),
      global: groupedFields.global.filter(match),
      otherCats: groupedFields.otherCats.filter(match),
    };
  }, [groupedFields, q]);

  const totalCount = filtered.currentCat.length + filtered.global.length;

  const handleSelect = (field: AddFieldItem) => {
    onSelectField(field);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSearch("");
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {t("productsConfig.tabsConfig.addFieldToTab")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("productsConfig.tabsConfig.searchFieldsPlaceholder")}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : totalCount === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {q
                ? t("common.emptySearch")
                : t("productsConfig.tabsConfig.allFieldsAssigned")}
            </p>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-3 max-h-64 overflow-y-auto rounded-md border p-2",
                SHEET_SCROLL_CLASS
              )}
            >
              <FieldGroup
                title={`${t("productsConfig.tabsConfig.categoryFields")} ${categoryName ?? ""}`}
                fields={filtered.currentCat}
                onSelect={handleSelect}
                disabled={disabled}
                t={t}
                categoryNameById={categoryNameById}
              />
              <FieldGroup
                title={t("productsConfig.tabsConfig.globalFields")}
                fields={filtered.global}
                onSelect={handleSelect}
                disabled={disabled}
                t={t}
                categoryNameById={categoryNameById}
              />
            </div>
          )}

          {onRequestCreateField && (
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {t("productsConfig.tabsConfig.createFieldHint")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onRequestCreateField();
                  onOpenChange(false);
                }}
              >
                <Plus className="mr-2 size-4" />
                {t("productsConfig.tabsConfig.createNewField")}
              </Button>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({
  title,
  fields,
  onSelect,
  disabled,
  t,
  categoryNameById,
}: {
  title: string;
  fields: AddFieldItem[];
  onSelect: (f: AddFieldItem) => void;
  disabled?: boolean;
  t: (key: string) => string;
  categoryNameById?: Map<string, string>;
}) {
  if (fields.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {fields.map((f) => (
          <button
            key={f.id}
            type="button"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted/50"
            onClick={() => onSelect(f)}
            disabled={disabled}
          >
            <Plus className="size-3 shrink-0 text-muted-foreground" />
            <span className="font-medium">{f.label}</span>
            <span className="text-xs text-muted-foreground">
              {f.code ?? f.label ?? "—"} ·{" "}
              {t(`widgetTypesShort.${f.widgetType}`) ||
                t(`widgetTypes.${f.widgetType}`) ||
                f.widgetType}
            </span>
            {categoryNameById && (f.categoryIds?.length ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground/80">
                (
                {(f.categoryIds ?? [])
                  .map((cid) => categoryNameById.get(cid) ?? cid)
                  .join(", ")}
                )
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
