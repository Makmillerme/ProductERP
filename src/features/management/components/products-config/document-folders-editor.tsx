"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-provider";
import { SHEET_INPUT_CLASS } from "@/config/sheet";

export type DocumentFolderItem = {
  code: string;
  label: string;
  maxFiles?: number;
};

function parseFoldersJson(json: string | null): DocumentFolderItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as { folders?: unknown[] };
    const folders = parsed?.folders;
    if (!Array.isArray(folders)) return [];
    return folders
      .filter(
        (f): f is Record<string, unknown> =>
          typeof f === "object" && f !== null && typeof (f as { code?: unknown }).code === "string"
      )
      .map((f) => ({
        code: String((f as { code: string }).code).trim(),
        label: String((f as { label?: string }).label ?? (f as { code: string }).code).trim(),
        maxFiles:
          typeof (f as { maxFiles?: unknown }).maxFiles === "number" &&
          (f as { maxFiles: number }).maxFiles > 0
            ? (f as { maxFiles: number }).maxFiles
            : undefined,
      }))
      .filter((f) => f.code.length > 0);
  } catch {
    return [];
  }
}

function foldersToJson(folders: DocumentFolderItem[]): string {
  if (folders.length === 0) return "";
  return JSON.stringify(
    { folders: folders.map((f) => ({ code: f.code, label: f.label, ...(f.maxFiles != null && f.maxFiles > 0 ? { maxFiles: f.maxFiles } : {}) })) },
    null,
    2
  );
}

type DocumentFoldersEditorProps = {
  value: string;
  onChange: (json: string) => void;
  disabled?: boolean;
};

export function DocumentFoldersEditor({
  value,
  onChange,
  disabled,
}: DocumentFoldersEditorProps) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const folders = parseFoldersJson(value);

  const addFolder = useCallback(() => {
    setError(null);
    const code = `folder_${folders.length + 1}`;
    const next = [...folders, { code, label: t("documentFolders.newFolder") }];
    onChange(foldersToJson(next));
  }, [folders, onChange, t]);

  const updateFolder = useCallback(
    (index: number, updates: Partial<DocumentFolderItem>) => {
      const next = folders.map((f, i) =>
        i === index ? { ...f, ...updates } : f
      );
      onChange(foldersToJson(next));
      setError(null);
    },
    [folders, onChange]
  );

  const removeFolder = useCallback(
    (index: number) => {
      const next = folders.filter((_, i) => i !== index);
      onChange(foldersToJson(next));
      setError(null);
    },
    [folders, onChange]
  );

  const handleLabelChange = (index: number, label: string) => {
    updateFolder(index, { label });
  };

  const handleCodeChange = (index: number, raw: string) => {
    const hasCyrillic = /[\u0400-\u04FF]/.test(raw);
    const sanitized = hasCyrillic
      ? slugify(raw)
      : raw.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    const code = sanitized || `folder_${index + 1}`;
    updateFolder(index, { code });
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{t("documentFolders.title")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFolder}
          disabled={disabled}
          className="shrink-0"
        >
          <Plus className="mr-1 size-3.5" />
          {t("documentFolders.addFolder")}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {folders.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 rounded-md border border-dashed text-center">
          {t("documentFolders.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {folders.map((folder, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 grid gap-1">
                  <Label className="text-xs text-muted-foreground">{t("documentFolders.name")}</Label>
                  <Input
                    value={folder.label}
                    onChange={(e) =>
                      handleLabelChange(index, e.target.value)
                    }
                    placeholder={t("documentFolders.namePlaceholder")}
                    disabled={disabled}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-1 w-28 shrink-0">
                  <Label className="text-xs text-muted-foreground">{t("documentFolders.code")}</Label>
                  <Input
                    value={folder.code}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    placeholder={t("documentFolders.codePlaceholder")}
                    disabled={disabled}
                    className={cn("font-mono text-xs", SHEET_INPUT_CLASS)}
                  />
                </div>
                <div className="grid gap-1 w-20 shrink-0">
                  <Label className="text-xs text-muted-foreground">{t("documentFolders.filesCount")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={folder.maxFiles ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const num = v === "" ? undefined : parseInt(v, 10);
                      updateFolder(index, {
                        maxFiles:
                          num != null && !Number.isNaN(num) && num > 0
                            ? num
                            : undefined,
                      });
                    }}
                    placeholder="—"
                    disabled={disabled}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive self-end"
                  onClick={() => removeFolder(index)}
                  disabled={disabled}
                  aria-label={t("documentFolders.ariaDeleteFolder")}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
