"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypesManagement } from "./vehicle-types-management";
import { TabsConfigManagement } from "./tabs-config-management";
const VCONFIG_TABS = ["types", "fields", "tabs", "settings"] as const;
type VConfigTab = (typeof VCONFIG_TABS)[number];

const TAB_LABELS: Record<VConfigTab, string> = {
  types: "Типи авто",
  fields: "Поля",
  tabs: "Таби та поля",
  settings: "Налаштування",
};

export function VehiclesConfig() {
  const [tab, setTab] = useQueryState("vconfigtab", {
    defaultValue: "types" as VConfigTab,
    parse: (v) =>
      VCONFIG_TABS.includes(v as VConfigTab) ? (v as VConfigTab) : "types",
    serialize: (v) => v,
  });

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as VConfigTab)}
      className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4"
    >
      <TabsList variant="line" className="w-full shrink-0">
        {VCONFIG_TABS.map((t) => (
          <TabsTrigger key={t} value={t} className="min-w-0 text-xs sm:text-sm">
            {TAB_LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="types" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <VehicleTypesManagement />
      </TabsContent>

      <TabsContent value="fields" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <p className="text-sm text-muted-foreground">Розділ у розробці.</p>
      </TabsContent>

      <TabsContent value="tabs" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <TabsConfigManagement />
      </TabsContent>

      <TabsContent value="settings" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <p className="text-sm text-muted-foreground">Розділ у розробці.</p>
      </TabsContent>
    </Tabs>
  );
}
