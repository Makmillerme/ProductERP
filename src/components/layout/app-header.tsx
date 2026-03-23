"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NAV_MAIN, NAV_FOOTER } from "@/config";
import { useSession, signOut } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-provider";
import { CalculatorDialog } from "@/features/products/components/calculator-dialog";
import { CurrencyRatesHeader } from "@/features/currency";

const ROUTE_TO_TITLE_KEY: Record<string, string> = Object.fromEntries([
  ...NAV_MAIN.flatMap((item) => [
    [item.url, item.titleKey],
    ...(item.items?.map((sub) => [sub.url, sub.titleKey]) ?? []),
  ]),
  ...NAV_FOOTER.map((item) => [item.url, item.titleKey]),
  ["/settings", "layout.routes.settings"],
  ["/kanban", "layout.routes.kanban"],
]);

function getBreadcrumbs(pathname: string): { titleKey?: string; fallback: string; href: string; isCurrent: boolean }[] {
  if (pathname === "/") {
    return [{ titleKey: "layout.breadcrumb.home", fallback: "Головна", href: "/", isCurrent: true }];
  }
  const segments = pathname.split("/").filter(Boolean);
  const items: { titleKey?: string; fallback: string; href: string; isCurrent: boolean }[] = [
    { titleKey: "layout.breadcrumb.home", fallback: "Головна", href: "/", isCurrent: false },
  ];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const titleKey = ROUTE_TO_TITLE_KEY[href];
    items.push({
      titleKey: titleKey ?? undefined,
      fallback: segment,
      href,
      isCurrent: href === pathname,
    });
  }
  return items;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const breadcrumbs = getBreadcrumbs(pathname);
  const { data: session } = useSession();
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const breadcrumbTitle = (item: { titleKey?: string; fallback: string }) =>
    item.titleKey ? t(item.titleKey) : item.fallback;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center gap-2 overflow-hidden min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <Fragment key={item.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.isCurrent ? (
                    <BreadcrumbPage>{breadcrumbTitle(item)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{breadcrumbTitle(item)}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <CurrencyRatesHeader />
      <button
        type="button"
        onClick={() => setCalculatorOpen(true)}
        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background outline-none ring-ring hover:bg-accent hover:text-accent-foreground focus-visible:ring-2"
        aria-label={t("layout.aria.calculator")}
      >
        <Calculator className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full outline-none ring-ring focus-visible:ring-2"
            aria-label={t("layout.aria.userMenu")}
          >
            <Avatar className="size-8">
              <AvatarImage src={session?.user?.image ?? undefined} alt="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("layout.userMenu.account")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=settings">{t("layout.userMenu.settings")}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={handleSignOut}
          >
            {t("layout.userMenu.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </header>
  );
}
