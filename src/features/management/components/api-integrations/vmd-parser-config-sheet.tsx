"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import { SHEET_CONTENT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_BODY_SCROLL_CLASS } from "@/config/sheet";

function buildImportExample(vehicleType: string) {
  return JSON.stringify(
    {
      products: [
        {
          mrn: "1234567890",
          vehicle_type: vehicleType,
          brand: "Volvo",
          model: "FH",
          vin: "WBADT43452G123456",
        },
      ],
    },
    null,
    2,
  );
}

function buildFieldMappingExample(customFieldLabel: string) {
  return JSON.stringify(
    {
      fields: [
        { code: "custom_field", label: customFieldLabel, dataType: "string", widgetType: "text_input" },
      ],
    },
    null,
    2,
  );
}

function buildAutoDetectExample(types: string[]) {
  return JSON.stringify({ types }, null, 2);
}

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

type VmdParserConfigSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VmdParserConfigSheet({ open, onOpenChange }: VmdParserConfigSheetProps) {
  const { t } = useLocale();
  const importExample = useMemo(
    () => buildImportExample(t("integrations.parser.exampleVehicleType")),
    [t]
  );
  const fieldMappingExample = useMemo(
    () => buildFieldMappingExample(t("integrations.parser.exampleCustomField")),
    [t]
  );
  const autoDetectExample = useMemo(
    () =>
      buildAutoDetectExample([
        t("integrations.parser.exampleTypeTruck"),
        t("integrations.parser.exampleTypeCar"),
        t("integrations.parser.exampleTypeBus"),
      ]),
    [t]
  );
  const [importJson, setImportJson] = useState(importExample);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const [fieldMappingJson, setFieldMappingJson] = useState(fieldMappingExample);
  const [fieldMappingResult, setFieldMappingResult] = useState<string | null>(null);
  const [fieldMappingLoading, setFieldMappingLoading] = useState(false);

  const [autoDetectJson, setAutoDetectJson] = useState(autoDetectExample);
  const [autoDetectResult, setAutoDetectResult] = useState<string | null>(null);
  const [autoDetectLoading, setAutoDetectLoading] = useState(false);

  const runImport = async () => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const body = JSON.parse(importJson);
      const res = await fetch("/api/admin/parser/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setImportResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setImportResult(e instanceof Error ? e.message : String(e));
    } finally {
      setImportLoading(false);
    }
  };

  const runFieldMapping = async () => {
    setFieldMappingLoading(true);
    setFieldMappingResult(null);
    try {
      const body = JSON.parse(fieldMappingJson);
      const res = await fetch("/api/admin/parser/field-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setFieldMappingResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setFieldMappingResult(e instanceof Error ? e.message : String(e));
    } finally {
      setFieldMappingLoading(false);
    }
  };

  const runAutoDetect = async () => {
    setAutoDetectLoading(true);
    setAutoDetectResult(null);
    try {
      const body = JSON.parse(autoDetectJson);
      const res = await fetch("/api/admin/parser/auto-detect-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setAutoDetectResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setAutoDetectResult(e instanceof Error ? e.message : String(e));
    } finally {
      setAutoDetectLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={SHEET_CONTENT_CLASS} side="right">
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle>{t("integrations.vmdParser.name")}</SheetTitle>
        </SheetHeader>
        <div className={SHEET_BODY_CLASS}>
          <div className={SHEET_BODY_SCROLL_CLASS}>
            <Tabs defaultValue="import" className="flex flex-col gap-4">
              <TabsList variant="line" className="w-full shrink-0">
                <TabsTrigger value="import" className="text-xs">
                  {t("integrations.parser.import")}
                </TabsTrigger>
                <TabsTrigger value="field-mapping" className="text-xs">
                  {t("integrations.parser.fieldMapping")}
                </TabsTrigger>
                <TabsTrigger value="auto-detect" className="text-xs">
                  {t("integrations.parser.autoDetect")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">POST /api/admin/parser/import</CardTitle>
                    <CardDescription className="text-xs">
                      {t("integrations.parser.importDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("integrations.parser.jsonBody")}</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={importJson}
                          onChange={(e) => setImportJson(e.target.value)}
                          rows={10}
                          className="min-w-0 flex-1 font-mono text-xs"
                        />
                        <CopyButton text={importJson} />
                      </div>
                    </div>
                    <Button onClick={runImport} disabled={importLoading} size="sm">
                      {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("integrations.parser.run")}
                    </Button>
                    {importResult && (
                      <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto max-h-40">
                        {importResult}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="field-mapping" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">POST /api/admin/parser/field-mapping</CardTitle>
                    <CardDescription className="text-xs">
                      {t("integrations.parser.fieldMappingDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("integrations.parser.jsonBody")}</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={fieldMappingJson}
                          onChange={(e) => setFieldMappingJson(e.target.value)}
                          rows={10}
                          className="min-w-0 flex-1 font-mono text-xs"
                        />
                        <CopyButton text={fieldMappingJson} />
                      </div>
                    </div>
                    <Button onClick={runFieldMapping} disabled={fieldMappingLoading} size="sm">
                      {fieldMappingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("integrations.parser.run")}
                    </Button>
                    {fieldMappingResult && (
                      <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto max-h-40">
                        {fieldMappingResult}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auto-detect" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">POST /api/admin/parser/auto-detect-types</CardTitle>
                    <CardDescription className="text-xs">
                      {t("integrations.parser.autoDetectDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("integrations.parser.jsonBody")}</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={autoDetectJson}
                          onChange={(e) => setAutoDetectJson(e.target.value)}
                          rows={6}
                          className="min-w-0 flex-1 font-mono text-xs"
                        />
                        <CopyButton text={autoDetectJson} />
                      </div>
                    </div>
                    <Button onClick={runAutoDetect} disabled={autoDetectLoading} size="sm">
                      {autoDetectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("integrations.parser.run")}
                    </Button>
                    {autoDetectResult && (
                      <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto max-h-40">
                        {autoDetectResult}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
