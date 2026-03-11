import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

/** /catalog — редірект на першу категорію або пропозиція створити */
export default async function CatalogPage() {
  const first = await prisma.category.findFirst({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (first) redirect(`/catalog/${first.id}`);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">Немає категорій.</p>
      <p className="text-xs text-muted-foreground/80">
        Щоб вести облік товару, спочатку створіть категорію.
      </p>
      <Button asChild variant="outline">
        <Link href="/management/data-model?tab=categories">Створити категорію</Link>
      </Button>
    </div>
  );
}
