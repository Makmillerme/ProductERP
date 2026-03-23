import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

/** /catalog — редірект на першу категорію або пропозиція створити */
export default async function CatalogPage() {
  const first = await prisma.category.findFirst({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (first) redirect(`/catalog/${first.id}`);
  const cookieStore = await cookies();
  const locale: Locale =
    cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "uk";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">
        {t("catalog.noCategories", locale)}
      </p>
      <p className="text-xs text-muted-foreground/80">
        {t("catalog.createCategoryHint", locale)}
      </p>
      <Button asChild variant="outline">
        <Link href="/management/data-model?tab=categories">
          {t("catalog.createCategoryButton", locale)}
        </Link>
      </Button>
    </div>
  );
}
