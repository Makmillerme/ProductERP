"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Workflow } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";

export function AutomationsPage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">{t("automations.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("automations.description")}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Workflow className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t("automations.comingSoon")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
