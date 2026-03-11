"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { APP_NAME, NAV_MAIN, NAV_FOOTER } from "@/config";
import { CatalogNavItem } from "./catalog-nav-item";

const SIDEBAR_HEADER_HEIGHT = "h-14";

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={`${SIDEBAR_HEADER_HEIGHT} min-h-14 shrink-0 flex flex-col justify-center border-b border-sidebar-border overflow-hidden p-0 px-2 py-0`}
      >
        <Link
          href="/"
          className="flex h-14 min-w-0 items-center gap-2 rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
          aria-label={APP_NAME}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
            <LayoutDashboard className="size-4" aria-hidden />
          </span>
          <span className="truncate font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden min-w-0">
            {APP_NAME}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:m-0">
            {t("layout.nav.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((item) =>
                item.dynamicItems === "categories" ? (
                  <CatalogNavItem
                    key={item.url}
                    title={t(item.titleKey)}
                    url={item.url}
                    icon={item.icon}
                  />
                ) : item.items && item.items.length > 0 ? (
                  <Collapsible
                    key={item.url}
                    asChild
                    defaultOpen={pathname.startsWith(item.url)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={t(item.titleKey)}
                          isActive={pathname.startsWith(item.url)}
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate min-w-0">{t(item.titleKey)}</span>
                          <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((sub) => (
                            <SidebarMenuSubItem key={sub.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.url}
                              >
                                <Link href={sub.url}>
                                  <span>{t(sub.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={t(item.titleKey)}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4 shrink-0" />
                        <span className="truncate min-w-0">{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {NAV_FOOTER.length > 0 && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {NAV_FOOTER.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={t(item.titleKey)}
                >
                  <Link href={item.url}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate min-w-0">{t(item.titleKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
