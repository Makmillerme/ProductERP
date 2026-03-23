"use client";

import { useLayoutEffect, useRef } from "react";
import { useQueryState } from "nuqs";
import { useLocale } from "@/lib/locale-provider";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagement } from "./users-management";
import { RolesManagement } from "./roles-management";
import { ProductsConfig } from "./products-config";

const MANAGEMENT_TABS = ["uploader", "products", "users"] as const;
type ManagementTab = (typeof MANAGEMENT_TABS)[number];

const USER_SUBTABS = ["users", "roles"] as const;
type UserSubtab = (typeof USER_SUBTABS)[number];

const STORAGE_KEY = "management-tab";

export function ManagementPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "uploader",
    parse: (v) => {
      if (v === "vehicles") return "products" as ManagementTab; // backward compat
      return MANAGEMENT_TABS.includes(v as ManagementTab) ? (v as ManagementTab) : "uploader";
    },
    serialize: (v) => v,
  });
  const [subtab, setSubtab] = useQueryState("subtab", {
    defaultValue: "users",
    parse: (v) =>
      USER_SUBTABS.includes(v as UserSubtab) ? (v as UserSubtab) : "users",
    serialize: (v) => v,
  });
  const hasRestoredRef = useRef(false);

  // Відновлення останнього таба при відкритті сторінки без ?tab= (перехід з іншої сторінки або перезавантаження)
  useLayoutEffect(() => {
    if (hasRestoredRef.current) return;
    const tabInUrl = searchParams.get("tab");
    if (tabInUrl && MANAGEMENT_TABS.includes(tabInUrl as ManagementTab)) return;
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    const resolved = saved === "vehicles" ? "products" : saved; // backward compat
    if (resolved && MANAGEMENT_TABS.includes(resolved as ManagementTab)) {
      hasRestoredRef.current = true;
      setTab(resolved as ManagementTab);
    }
  }, [searchParams, setTab]);

  const handleTabChange = (value: string) => {
    const newTab = value as ManagementTab;
    setTab(newTab);
    sessionStorage.setItem(STORAGE_KEY, newTab);
  };

  // Синхронізувати поточний таб у sessionStorage (включно з відкриттям по посиланню з ?tab=)
  useLayoutEffect(() => {
    if (tab && MANAGEMENT_TABS.includes(tab as ManagementTab)) {
      sessionStorage.setItem(STORAGE_KEY, tab);
    }
  }, [tab]);

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4"
    >
      <TabsList variant="line" className="w-full shrink-0">
        <TabsTrigger value="uploader" className="flex-1 min-w-0 text-xs sm:text-sm">
          {t("management.tabs.uploader")}
        </TabsTrigger>
        <TabsTrigger value="products" className="flex-1 min-w-0 text-xs sm:text-sm">
          {t("management.tabs.products")}
        </TabsTrigger>
        <TabsTrigger value="users" className="flex-1 min-w-0 text-xs sm:text-sm">
          {t("management.tabs.users")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="uploader" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-muted-foreground">
                {t("management.uploader.quickPeriods")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" disabled>
                  {t("management.uploader.days7")}
                </Button>
                <Button variant="default" disabled>
                  {t("management.uploader.days30")}
                </Button>
                <Button variant="default" disabled>
                  {t("management.uploader.currentMonth")}
                </Button>
                <Button variant="outline" disabled>
                  {t("management.uploader.customRange")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("management.uploader.apiComingSoon")}
              </p>
            </CardContent>
            <CardFooter>
              <Button disabled>{t("management.uploader.runUpload")}</Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="products" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <ProductsConfig />
      </TabsContent>

      <TabsContent value="users" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
        <Tabs
          value={subtab}
          onValueChange={(v) => setSubtab(v as UserSubtab)}
          className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4"
        >
          <TabsList variant="line" className="w-full shrink-0 max-w-xs">
            <TabsTrigger value="users" className="min-w-0 text-xs sm:text-sm">
              {t("management.tabs.usersTab")}
            </TabsTrigger>
            <TabsTrigger value="roles" className="min-w-0 text-xs sm:text-sm">
              {t("management.tabs.rolesTab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
            <UsersManagement />
          </TabsContent>
          <TabsContent value="roles" className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3">
            <RolesManagement />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
