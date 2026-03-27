"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IntegrationsTab() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("integrations.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("integrations.description")}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <Plug className="size-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t("integrations.empty")}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                {t("integrations.add")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("integrations.addComingSoon")}</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    </div>
  );
}
