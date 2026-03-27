"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowUpDown, Filter, Columns3 } from "lucide-react";
import {
  DEFAULT_DISPLAY_CONFIG,
  parseDisplayConfig,
  stringifyDisplayConfig,
  type CategoryDisplayConfig,
} from "../types/display-config";
import {
  useListConfig,
  listConfigQueryKeys,
} from "@/features/products/hooks/use-list-config";
import { MANAGEMENT_STALE_MS, managementAdminKeys } from "@/lib/query-keys";
import { fetchAdminCategories } from "@/lib/api/admin/catalog";
import { adminGetJson, adminMutationJson } from "@/lib/api/admin/client";
import { toast } from "sonner";

type CategoryWithCount = { id: string; name: string; order: number };

async function fetchDisplayConfig(
  categoryId: string,
  t: (key: string) => string
): Promise<CategoryDisplayConfig> {
  return adminGetJson<CategoryDisplayConfig>(
    `/display-config?categoryId=${encodeURIComponent(categoryId)}`,
    t("errors.loadFailed")
  );
}

async function saveDisplayConfig(
  categoryId: string,
  config: CategoryDisplayConfig,
  t: (key: string) => string
): Promise<CategoryDisplayConfig> {
  return adminMutationJson<CategoryDisplayConfig>("/display-config", {
    method: "PUT",
    body: { categoryId, config },
    fallbackError: t("errors.saveFailed"),
  });
}

const DISPLAY_CONFIG_KEYS = listConfigQueryKeys.all;

export function DisplaySettingsManagement() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: [...managementAdminKeys.categories],
    queryFn: () => fetchAdminCategories(t) as Promise<CategoryWithCount[]>,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories]
  );

  const effectiveCategoryId = categoryId || sortedCategories[0]?.id || "";

  const { listConfig } = useListConfig(effectiveCategoryId);
  const { data: displayConfigData } = useQuery({
    queryKey: [...DISPLAY_CONFIG_KEYS, "display", effectiveCategoryId],
    queryFn: () => fetchDisplayConfig(effectiveCategoryId, t),
    enabled: !!effectiveCategoryId,
    staleTime: 60 * 1000,
  });
  const displayConfig = displayConfigData ?? DEFAULT_DISPLAY_CONFIG;

  useEffect(() => {
    if (sortedCategories.length > 0 && !categoryId) {
      setCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, categoryId]);

  const [localConfig, setLocalConfig] = useState<CategoryDisplayConfig>(() => DEFAULT_DISPLAY_CONFIG);
  useEffect(() => {
    setLocalConfig(displayConfigData ?? DEFAULT_DISPLAY_CONFIG);
  }, [displayConfigData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const catId = effectiveCategoryId;
      const data = await saveDisplayConfig(catId, localConfig, t);
      return { data, categoryId: catId };
    },
    onSuccess: ({ data, categoryId }) => {
      setLocalConfig(data);
      queryClient.setQueryData(
        [...DISPLAY_CONFIG_KEYS, "display", categoryId],
        data
      );
      queryClient.invalidateQueries({
        queryKey: listConfigQueryKeys.category(categoryId),
      });
      toast.success(t("toasts.changesSaved"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const tableColumns = useMemo(
    () => listConfig?.tableColumns ?? [],
    [listConfig?.tableColumns]
  );
  const filterableFields = useMemo(
    () => listConfig?.filterableFields ?? [],
    [listConfig?.filterableFields]
  );
  const stringFilterable = filterableFields.filter((f) => f.dataType === "string");
  const sortableOptions = useMemo(() => {
    const fromCols = tableColumns;
    const hasCreatedAt = fromCols.some((c) => c.id === "created_at");
    if (hasCreatedAt) return fromCols;
    return [
      { id: "created_at" as const, label: t("display.settings.createdAt"), defaultVisible: true },
      ...fromCols,
    ];
  }, [tableColumns, t]);

  const searchableIds = useMemo(() => {
    if (localConfig.searchableFieldCodes?.length) {
      return new Set(localConfig.searchableFieldCodes);
    }
    return new Set(stringFilterable.map((f) => f.code));
  }, [localConfig.searchableFieldCodes, stringFilterable]);

  const filterableIds = useMemo(() => {
    if (localConfig.filterableFieldCodes?.length) {
      return new Set(localConfig.filterableFieldCodes);
    }
    return new Set(filterableFields.map((f) => f.code));
  }, [localConfig.filterableFieldCodes, filterableFields]);

  const visibleColumnIds = useMemo(() => {
    if (localConfig.visibleColumnIds?.length) {
      return [...localConfig.visibleColumnIds];
    }
    return tableColumns.map((c) => c.id);
  }, [localConfig.visibleColumnIds, tableColumns]);

  const toggleSearchable = (code: string, checked: boolean) => {
    const next = new Set(searchableIds);
    if (checked) next.add(code);
    else next.delete(code);
    setLocalConfig((c) => ({
      ...c,
      searchableFieldCodes: stringFilterable.filter((f) => next.has(f.code)).map((f) => f.code),
    }));
  };

  const toggleFilterable = (code: string, checked: boolean) => {
    const next = new Set(filterableIds);
    if (checked) next.add(code);
    else next.delete(code);
    setLocalConfig((c) => ({
      ...c,
      filterableFieldCodes: filterableFields.filter((f) => next.has(f.code)).map((f) => f.code),
    }));
  };

  const setDefaultSort = (key: string, dir: "asc" | "desc") => {
    setLocalConfig((c) => ({
      ...c,
      defaultSortKey: key || undefined,
      defaultSortDir: dir || undefined,
    }));
  };

  const setVisibleColumns = (ids: string[]) => {
    setLocalConfig((c) => ({ ...c, visibleColumnIds: ids }));
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    const next = [...visibleColumnIds];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setVisibleColumns(next);
  };

  const toggleColumnVisible = (id: string, checked: boolean) => {
    if (checked) {
      setVisibleColumns([...visibleColumnIds, id]);
    } else {
      setVisibleColumns(visibleColumnIds.filter((x) => x !== id));
    }
  };

  const hasChanges =
    JSON.stringify(parseDisplayConfig(stringifyDisplayConfig(localConfig))) !==
    JSON.stringify(parseDisplayConfig(stringifyDisplayConfig(displayConfig)));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">{t("display.settings.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("display.settings.description")}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">{t("display.settings.category")}</Label>
            <Select
              value={effectiveCategoryId}
              onValueChange={setCategoryId}
              disabled={sortedCategories.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    sortedCategories.length === 0
                      ? t("dataModel.createCategoryFirst")
                      : t("common.selectCategoryPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {tableColumns.length === 0 && effectiveCategoryId ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {t("display.settings.configureCardFirst")}
          </p>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-muted-foreground" />
                <h3 className="font-medium">{t("display.settings.searchTitle")}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("display.settings.searchDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {stringFilterable.length > 0 ? (
                  stringFilterable.map((f) => (
                    <label
                      key={f.code}
                      className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={searchableIds.has(f.code)}
                        onCheckedChange={(v) => toggleSearchable(f.code, !!v)}
                      />
                      {f.label}
                    </label>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("display.settings.noStringFields")}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-4 text-muted-foreground" />
                <h3 className="font-medium">{t("display.settings.sortTitle")}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("display.settings.sortDescription")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs">{t("display.settings.sortField")}</Label>
                  <Select
                    value={localConfig.defaultSortKey ?? "created_at"}
                    onValueChange={(v) =>
                      setDefaultSort(v, localConfig.defaultSortDir ?? "desc")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortableOptions.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">{t("display.settings.sortDirection")}</Label>
                  <Select
                    value={localConfig.defaultSortDir ?? "desc"}
                    onValueChange={(v) =>
                      setDefaultSort(
                        localConfig.defaultSortKey ?? "created_at",
                        v as "asc" | "desc"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">{t("display.settings.sortAsc")}</SelectItem>
                      <SelectItem value="desc">{t("display.settings.sortDesc")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <h3 className="font-medium">{t("display.settings.filterTitle")}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("display.settings.filterDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {filterableFields.length > 0 ? (
                  filterableFields.map((f) => (
                    <label
                      key={f.code}
                      className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={filterableIds.has(f.code)}
                        onCheckedChange={(v) => toggleFilterable(f.code, !!v)}
                      />
                      {f.label}
                    </label>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("display.settings.noFilterFields")}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Columns3 className="size-4 text-muted-foreground" />
                <h3 className="font-medium">{t("display.settings.columnsTitle")}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("display.settings.columnsDescription")}
              </p>
              <div className="space-y-2">
                {visibleColumnIds.map((id, i) => {
                  const col = tableColumns.find((c) => c.id === id);
                  if (!col) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={(v) => toggleColumnVisible(id, !!v)}
                      />
                      <span className="flex-1 text-sm">{col.label}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={i === 0}
                          onClick={() => moveColumn(i, "up")}
                          aria-label={t("display.settings.moveUp")}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={i === visibleColumnIds.length - 1}
                          onClick={() => moveColumn(i, "down")}
                          aria-label={t("display.settings.moveDown")}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {tableColumns
                  .filter((c) => !visibleColumnIds.includes(c.id))
                  .map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5 opacity-70"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() =>
                          setVisibleColumns([...visibleColumnIds, col.id])
                        }
                      />
                      <span className="flex-1 text-sm">{col.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {hasChanges && effectiveCategoryId && (
          <div className="mt-6 flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? t("common.saving") : t("common.save")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocalConfig(displayConfig)}
              disabled={saveMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
