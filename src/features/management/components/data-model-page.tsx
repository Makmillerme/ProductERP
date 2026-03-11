"use client";

import { useLayoutEffect, useRef } from "react";
import { useQueryState } from "nuqs";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDataModelTab,
  setDataModelTab,
} from "@/lib/management-state";
import { StatusesManagement } from "./vehicles-config/statuses-management";
import { CategoriesManagement } from "./vehicles-config/categories-management";
import { TabsConfigManagement } from "./vehicles-config/tabs-config-management";
import { FieldDefinitionsManagement } from "./vehicles-config/field-definitions-management";
const DATA_MODEL_TABS = ["statuses", "categories", "data", "card"] as const;
type DataModelTab = (typeof DATA_MODEL_TABS)[number];

const TAB_LABELS: Record<DataModelTab, string> = {
  statuses: "Статуси",
  categories: "Категорії",
  data: "Поля та дані",
  card: "Картка товару",
};

export function DataModelPage() {
  const searchParams = useSearchParams();
  const hasRestoredRef = useRef(false);

  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "statuses" as DataModelTab,
    parse: (v) =>
      DATA_MODEL_TABS.includes(v as DataModelTab)
        ? (v as DataModelTab)
        : "statuses",
    serialize: (v) => v,
  });

  /** Відновлення останнього таба при відкритті без ?tab= в URL */
  useLayoutEffect(() => {
    if (hasRestoredRef.current) return;
    const tabInUrl = searchParams.get("tab");
    if (tabInUrl && DATA_MODEL_TABS.includes(tabInUrl as DataModelTab)) return;
    const saved = getDataModelTab();
    if (saved && DATA_MODEL_TABS.includes(saved as DataModelTab)) {
      hasRestoredRef.current = true;
      setTab(saved as DataModelTab);
    }
  }, [searchParams, setTab]);

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
      onValueChange={handleTabChange}
      className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4"
    >
      <TabsList variant="line" className="w-full shrink-0">
        {DATA_MODEL_TABS.map((t) => (
          <TabsTrigger
            key={t}
            value={t}
            className="flex-1 min-w-0 text-xs sm:text-sm"
          >
            {TAB_LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="statuses"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <StatusesManagement />
      </TabsContent>

      <TabsContent
        value="categories"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <CategoriesManagement />
      </TabsContent>

      <TabsContent
        value="card"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <TabsConfigManagement />
      </TabsContent>

      <TabsContent
        value="data"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <FieldDefinitionsManagement />
      </TabsContent>

    </Tabs>
  );
}
