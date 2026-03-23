"use client";

import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { useLocale } from "@/lib/locale-provider";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDataModelTab,
  setDataModelTab,
  getCardCategoryId,
  setCardCategoryId,
  getDataModelProductTypeId,
  setDataModelProductTypeId,
} from "@/lib/management-state";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";
import { StatusesManagement } from "./products-config/statuses-management";
import { CategoriesManagement } from "./products-config/categories-management";
import { FieldDefinitionsManagement } from "./products-config/field-definitions-management";

const CATEGORIES_KEY = ["admin", "categories"] as const;
const PRODUCT_TYPES_KEY = ["admin", "product-types"] as const;

type CategoryWithCount = { id: string; name: string; order: number; _count?: { productTypes: number; tabs: number } };

async function fetchCategories(t: (key: string) => string): Promise<CategoryWithCount[]> {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("common.loadCategoriesFailed"));
  }
  const data = await res.json();
  return data.categories ?? data ?? [];
}

type ProductTypeItem = { id: string; name: string; categoryId: string | null };

async function fetchProductTypes(t: (key: string) => string): Promise<ProductTypeItem[]> {
  const res = await fetch("/api/admin/product-types");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("common.loadTypesFailed"));
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.productTypes ?? data?.vehicleTypes ?? []);
}
const DATA_MODEL_TABS = ["statuses", "categories", "data"] as const;
type DataModelTab = (typeof DATA_MODEL_TABS)[number];

export function DataModelPage() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRestoredRef = useRef(false);
  const hasInitializedCategoryRef = useRef(false);
  const hasInitializedProductTypeRef = useRef(false);

  const { data: categories = [] } = useQuery({
    queryKey: [...CATEGORIES_KEY],
    queryFn: () => fetchCategories(t),
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: allProductTypes = [] } = useQuery({
    queryKey: [...PRODUCT_TYPES_KEY],
    queryFn: () => fetchProductTypes(t),
    staleTime: MANAGEMENT_STALE_MS,
  });

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProductTypeId, setSelectedProductTypeId] = useState("");
  const [createFieldCategoryId, setCreateFieldCategoryId] = useState<string | null>(null);

  const typesForSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return allProductTypes;
    return allProductTypes.filter((t) => t.categoryId === selectedCategoryId);
  }, [allProductTypes, selectedCategoryId]);

  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "statuses" as DataModelTab,
    parse: (v) =>
      DATA_MODEL_TABS.includes(v as DataModelTab)
        ? (v as DataModelTab)
        : "statuses",
    serialize: (v) => v,
  });

  useEffect(() => {
    if (categories.length === 0) return;
    const ids = new Set(categories.map((c) => c.id));

    if (selectedCategoryId && !ids.has(selectedCategoryId)) {
      const first = sortedCategories[0];
      if (first) {
        setSelectedCategoryId(first.id);
        setCardCategoryId(first.id);
      } else {
        setSelectedCategoryId("");
      }
      return;
    }

    if (hasInitializedCategoryRef.current) return;
    hasInitializedCategoryRef.current = true;

    const savedId = getCardCategoryId();
    const savedExists = savedId !== null && (savedId === "" || ids.has(savedId));
    if (savedExists) {
      setSelectedCategoryId(savedId ?? "");
    } else {
      setSelectedCategoryId("");
      setCardCategoryId("");
    }
  }, [categories, sortedCategories, selectedCategoryId]);

  useEffect(() => {
    const typeIds = new Set(typesForSelectedCategory.map((t) => t.id));
    if (typesForSelectedCategory.length === 0) {
      setSelectedProductTypeId("");
      hasInitializedProductTypeRef.current = false;
      return;
    }

    if (selectedProductTypeId && !typeIds.has(selectedProductTypeId)) {
      setSelectedProductTypeId("");
      setDataModelProductTypeId("");
      return;
    }

    if (hasInitializedProductTypeRef.current) return;
    hasInitializedProductTypeRef.current = true;

    const savedTypeId = getDataModelProductTypeId();
    if (savedTypeId && typeIds.has(savedTypeId)) {
      setSelectedProductTypeId(savedTypeId);
    } else {
      setSelectedProductTypeId("");
    }
  }, [typesForSelectedCategory, selectedProductTypeId]);

  const handleCategoryChange = (categoryId: string) => {
    const value = categoryId === "__all__" ? "" : categoryId;
    setSelectedCategoryId(value);
    setSelectedProductTypeId("");
    hasInitializedProductTypeRef.current = false;
    setCardCategoryId(value);
  };

  const handleProductTypeChange = (productTypeId: string) => {
    const value = productTypeId === "__all__" ? "" : productTypeId;
    setSelectedProductTypeId(value);
    setDataModelProductTypeId(value);
  };

  /** Відновлення останнього таба при відкритті без ?tab= в URL. tab=card → редірект на /management/display */
  useLayoutEffect(() => {
    const tabInUrl = searchParams.get("tab");
    if (tabInUrl === "card") {
      window.location.href = "/management/display";
      return;
    }
    if (hasRestoredRef.current) return;
    if (tabInUrl && DATA_MODEL_TABS.includes(tabInUrl as DataModelTab)) return;
    const saved = getDataModelTab();
    if (saved && saved !== "card" && DATA_MODEL_TABS.includes(saved as DataModelTab)) {
      hasRestoredRef.current = true;
      setTab(saved as DataModelTab);
    }
  }, [searchParams, setTab]);

  /** createForCategory з URL — при переході з Відображення для створення поля */
  const createForCategoryParam = searchParams.get("createForCategory");
  useEffect(() => {
    if (!createForCategoryParam) return;
    setCreateFieldCategoryId(createForCategoryParam);
    router.replace("/management/data-model?tab=data", { scroll: false });
  }, [createForCategoryParam, router]);

  const handleTabChange = (value: string) => {
    const newTab = value as DataModelTab;
    setTab(newTab);
    setDataModelTab(newTab);
  };

  /** Синхронізувати поточний таб у storage (включно з відкриттям по посиланню з ?tab=) */
  useLayoutEffect(() => {
    if (tab && DATA_MODEL_TABS.includes(tab as DataModelTab)) {
      setDataModelTab(tab);
    }
  }, [tab]);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => handleTabChange(v)}
      className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4 min-w-0"
    >
      <div className="flex flex-col gap-3 md:gap-4 min-w-0">
        <TabsList variant="line" className="w-full shrink-0">
          {DATA_MODEL_TABS.map((tabKey) => (
            <TabsTrigger
              key={tabKey}
              value={tabKey}
              className="flex-1 min-w-0 text-xs sm:text-sm"
            >
              {t(`dataModel.tabs.${tabKey}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="statuses"
          className="mt-0 p-2 data-[state=inactive]:hidden md:p-3"
        >
          <StatusesManagement />
        </TabsContent>

        <TabsContent
          value="categories"
          className="mt-0 p-2 data-[state=inactive]:hidden md:p-3"
        >
          <CategoriesManagement />
        </TabsContent>

        <TabsContent
          value="data"
          className="mt-0 p-2 data-[state=inactive]:hidden md:p-3"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 flex-wrap">
              <Select
                value={selectedCategoryId || "__all__"}
                onValueChange={(id) => handleCategoryChange(id)}
                disabled={categories.length === 0}
              >
                <SelectTrigger className="w-fit min-w-[8rem]">
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? t("dataModel.createCategoryFirst")
                        : t("common.selectCategoryPlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent className="min-w-max">
                  <SelectItem value="__all__">{t("dataModel.allCategories")}</SelectItem>
                  {sortedCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length > 0 && typesForSelectedCategory.length > 0 && (
                <Select
                  value={selectedProductTypeId || "__all__"}
                  onValueChange={(v) => handleProductTypeChange(v)}
                >
                  <SelectTrigger className="w-fit min-w-[8rem]">
                    <SelectValue placeholder={t("dataModel.allTypes")} />
                  </SelectTrigger>
                  <SelectContent className="min-w-max">
                    <SelectItem value="__all__">{t("dataModel.allTypes")}</SelectItem>
                    {typesForSelectedCategory.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <FieldDefinitionsManagement
              categoryId={selectedCategoryId}
              productTypeId={selectedProductTypeId || undefined}
              openCreateForCategoryId={createFieldCategoryId}
              onClearCreateIntent={() => setCreateFieldCategoryId(null)}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
