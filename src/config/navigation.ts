import {
  LayoutDashboard,
  SlidersHorizontal,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  /** Ключ для i18n (layout.nav.*) */
  titleKey: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
  /** Якщо задано, підпункти підвантажуються з API (наприклад категорії) */
  dynamicItems?: "categories";
};

export type NavSubItem = {
  /** Ключ для i18n (layout.nav.*) */
  titleKey: string;
  url: string;
};

export const APP_NAME = "VMD Parser" as const;

export const NAV_MAIN: NavItem[] = [
  { titleKey: "layout.nav.home", url: "/", icon: LayoutDashboard },
  {
    titleKey: "layout.nav.management",
    url: "/management",
    icon: SlidersHorizontal,
    items: [
      { titleKey: "layout.nav.dataModel", url: "/management/data-model" },
      { titleKey: "layout.nav.display", url: "/management/display" },
      { titleKey: "layout.nav.apiIntegrations", url: "/management/api-integrations" },
      { titleKey: "layout.nav.automations", url: "/management/automations" },
      { titleKey: "layout.nav.users", url: "/management/users" },
    ],
  },
  {
    titleKey: "layout.nav.productCatalog",
    url: "/catalog",
    icon: ClipboardList,
    dynamicItems: "categories",
  },
];

export const NAV_FOOTER: NavItem[] = [];
