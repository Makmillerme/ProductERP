"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/lib/locale-provider";
import { UsersManagement } from "./users-management";
import { RolesManagement } from "./roles-management";

const USER_TABS = ["users", "roles"] as const;
type UserTab = (typeof USER_TABS)[number];

export function UsersPage() {
  const { t } = useLocale();
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "users" as UserTab,
    parse: (v) =>
      USER_TABS.includes(v as UserTab) ? (v as UserTab) : "users",
    serialize: (v) => v,
  });

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as UserTab)}
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

      <TabsContent
        value="users"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <UsersManagement />
      </TabsContent>

      <TabsContent
        value="roles"
        className="mt-3 flex-1 overflow-auto p-2 data-[state=inactive]:hidden md:mt-4 md:p-3"
      >
        <RolesManagement />
      </TabsContent>
    </Tabs>
  );
}
