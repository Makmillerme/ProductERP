"use client";

import { useQueryState } from "nuqs";
import { useLocale } from "@/lib/locale-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTypesManagement } from "./product-types-management";
import { TabsConfigManagement } from "./tabs-config-management";
const VCONFIG_TABS = ["types", "fields", "tabs", "settings"] as const;
type VConfigTab = (typeof VCONFIG_TABS)[number];

export function ProductsConfig() {
  const { t } = useLocale();
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
        {VCONFIG_TABS.map((tabKey) => (
          <TabsTrigger key={tabKey} value={tabKey} className="min-w-0 text-xs sm:text-sm">
            {t(`productsConfig.tabs.${tabKey}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="types" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <ProductTypesManagement />
      </TabsContent>

      <TabsContent value="fields" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <p className="text-sm text-muted-foreground">{t("productsConfig.emptyStates.sectionInDev")}</p>
      </TabsContent>

      <TabsContent value="tabs" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <TabsConfigManagement />
      </TabsContent>

      <TabsContent value="settings" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <p className="text-sm text-muted-foreground">{t("productsConfig.emptyStates.sectionInDev")}</p>
      </TabsContent>
    </Tabs>
  );
}
