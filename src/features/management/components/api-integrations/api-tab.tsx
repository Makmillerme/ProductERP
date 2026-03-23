"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Copy, Check } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import apiDocsData from "@/config/api-docs/index.json";

type ApiDocsData = {
  sections: { id: string; titleKey: string }[];
  endpoints: Record<string, { method: string; path: string; descriptionKey: string }[]>;
};

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  PATCH: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-600 border-red-500/30",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button type="button" variant="ghost" size="icon" onClick={copy} className="h-8 w-8 shrink-0">
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export function ApiTab() {
  const { t } = useLocale();
  const data = apiDocsData as ApiDocsData;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("apiDocs.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("apiDocs.description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {data.sections.map((section) => {
          const endpoints = data.endpoints[section.id] ?? [];
          if (endpoints.length === 0) return null;

          return (
            <Collapsible key={section.id} defaultOpen={section.id === "products"} className="group">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="group/trigger cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-base">{t(section.titleKey)}</CardTitle>
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="flex flex-col gap-3">
                      {endpoints.map((ep, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={METHOD_COLORS[ep.method] ?? "bg-muted"}
                            >
                              {ep.method}
                            </Badge>
                            <code className="text-sm font-mono bg-background px-2 py-0.5 rounded flex-1 min-w-0 truncate">
                              {ep.path}
                            </code>
                            <CopyButton text={ep.path} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t(ep.descriptionKey)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
