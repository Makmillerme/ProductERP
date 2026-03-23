"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Settings } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VmdParserConfigSheet } from "./vmd-parser-config-sheet";

/** Pre-configured integration blocks. Later: from DB. */
const INTEGRATION_BLOCKS = [
  {
    id: "vmd-parser",
    typeKey: "integrations.vmdParser.name",
    descriptionKey: "integrations.vmdParser.description",
    status: "connected" as const,
    icon: Plug,
  },
];

export function IntegrationsTab() {
  const { t } = useLocale();
  const blocks = INTEGRATION_BLOCKS;
  const [parserSheetOpen, setParserSheetOpen] = useState(false);

  const handleConfigure = (blockId: string) => {
    if (blockId === "vmd-parser") {
      setParserSheetOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("integrations.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("integrations.description")}
        </p>
      </div>

      {blocks.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <Card key={block.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {t(block.typeKey)}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            block.status === "connected"
                              ? "text-emerald-600 border-emerald-500/30 mt-1"
                              : "text-muted-foreground mt-1"
                          }
                        >
                          {t(`integrations.${block.status}`)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {t(block.descriptionKey)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleConfigure(block.id)}
                  >
                    <Settings className="size-4" />
                    {t("integrations.configure")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <VmdParserConfigSheet open={parserSheetOpen} onOpenChange={setParserSheetOpen} />
    </div>
  );
}
