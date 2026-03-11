import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Редірект з /kanban на каталог з режимом Канбан.
 */
export default async function KanbanRedirectPage() {
  const first = await prisma.category.findFirst({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (first) redirect(`/catalog/${first.id}?view=kanban`);
  redirect("/catalog");
}
