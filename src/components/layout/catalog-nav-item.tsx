"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

type CategoryItem = { id: string; name: string; code: string; order: number };

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data?.categories ?? data ?? [];
}

type CatalogNavItemProps = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function CatalogNavItem({ title, url: _url, icon: Icon }: CatalogNavItemProps) {
  void _url; // Reserved for future use (e.g. catalog base path)
  const pathname = usePathname();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "nav"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const isCatalogActive = pathname.startsWith("/catalog");

  if (sorted.length === 0) return null;

  return (
    <Collapsible
      asChild
      defaultOpen={isCatalogActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title} isActive={isCatalogActive}>
            <Icon className="size-4 shrink-0" />
            <span className="truncate min-w-0">{title}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {sorted.map((cat) => (
              <SidebarMenuSubItem key={cat.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === `/catalog/${cat.id}`}
                >
                  <Link href={`/catalog/${cat.id}`}>
                    <span>{cat.name}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
