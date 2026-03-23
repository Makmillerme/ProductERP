import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export async function KanbanPage() {
  const cookieStore = await cookies();
  const locale: Locale =
    cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "uk";
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("kanban.title", locale)}
      </h1>
      <p className="text-muted-foreground">
        {t("products.kanbanComingSoon", locale)}
      </p>
    </div>
  );
}
