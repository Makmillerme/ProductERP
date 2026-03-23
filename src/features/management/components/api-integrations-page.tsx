"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileJson, Plug } from "lucide-react";
import { ApiTab } from "./api-integrations/api-tab";
import { IntegrationsTab } from "./api-integrations/integrations-tab";
import { useLocale } from "@/lib/locale-provider";

const TABS = ["api", "integrations"] as const;
type TabValue = (typeof TABS)[number];

export function ApiIntegrationsPage() {
  const { t } = useLocale();
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "api" as TabValue,
    parse: (v) => (TABS.includes(v as TabValue) ? (v as TabValue) : "api"),
    serialize: (v) => v,
  });

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabValue)}
      className="flex flex-col gap-3 md:gap-4"
    >
      <TabsList variant="line" className="w-full shrink-0">
        <TabsTrigger value="api" className="min-w-0 gap-2 text-xs sm:text-sm">
          <FileJson className="size-4 shrink-0" />
          {t("apiIntegrations.apiTab")}
        </TabsTrigger>
        <TabsTrigger value="integrations" className="min-w-0 gap-2 text-xs sm:text-sm">
          <Plug className="size-4 shrink-0" />
          {t("integrations.title")}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="api"
        className="mt-3 p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <ApiTab />
      </TabsContent>

      <TabsContent
        value="integrations"
        className="mt-3 p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <IntegrationsTab />
      </TabsContent>
    </Tabs>
  );
}
