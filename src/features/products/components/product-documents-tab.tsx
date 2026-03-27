"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, FileText, FileImage, FileVideo, File, X, ExternalLink, Loader2, Folder } from "lucide-react";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
import { ManagementListLoading } from "@/components/management-list-states";
import { cn } from "@/lib/utils";
import type { ProductDoc } from "@/config/product-documents";

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchDocuments(productId: number, t: (key: string) => string): Promise<ProductDoc[]> {
  const res = await fetch(`/api/products/${productId}/documents`);
  if (!res.ok) throw new Error(t("productDocuments.loadFailed"));
  const data = await res.json();
  return data.documents ?? [];
}

async function uploadDocument(productId: number, folder: string, file: File, t: (key: string) => string): Promise<ProductDoc> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch(`/api/products/${productId}/documents`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? t("productDocuments.uploadFailed"));
  return data as ProductDoc;
}

async function deleteDocument(productId: number, docId: number, t: (key: string) => string): Promise<void> {
  const res = await fetch(`/api/products/${productId}/documents/${docId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productDocuments.deleteFailed"));
  }
}

// ─── File icon helper ─────────────────────────────────────────────────────────

function FileIcon({ mimeType, className }: { mimeType: string | null; className?: string }) {
  if (!mimeType) return <File className={cn("size-7 text-muted-foreground", className)} />;
  if (mimeType.startsWith("image/")) return <FileImage className={cn("size-7 text-blue-400", className)} />;
  if (mimeType.startsWith("video/")) return <FileVideo className={cn("size-7 text-purple-400", className)} />;
  if (mimeType === "application/pdf") return <FileText className={cn("size-7 text-red-400", className)} />;
  return <FileText className={cn("size-7 text-muted-foreground", className)} />;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

// ─── DocThumbnail ─────────────────────────────────────────────────────────────

type DocThumbnailProps = {
  doc: ProductDoc;
  onRequestDelete: (doc: ProductDoc) => void;
  deleting: boolean;
};

function DocThumbnail({ doc, onRequestDelete, deleting }: DocThumbnailProps) {
  const { t } = useLocale();
  const isImage = doc.mimeType?.startsWith("image/");
  const shortName = doc.fileName.length > 18
    ? doc.fileName.slice(0, 15) + "…" + doc.fileName.slice(doc.fileName.lastIndexOf("."))
    : doc.fileName;

  return (
    <div className="group relative flex flex-col items-center gap-1">
      {/* Tile */}
      <div
        className="relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 transition-all hover:border-ring hover:bg-muted"
        onClick={() => window.open(doc.filePath, "_blank")}
        title={doc.fileName}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.filePath}
            alt={doc.fileName}
            className="size-full object-cover"
          />
        ) : (
          <FileIcon mimeType={doc.mimeType} />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-4 text-white" />
        </div>
        {/* Delete button */}
        <button
          type="button"
          disabled={deleting}
          onClick={(e) => { e.stopPropagation(); onRequestDelete(doc); }}
          className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/80 disabled:opacity-50"
          aria-label={t("productDocuments.ariaDelete")}
        >
          <X className="size-3" />
        </button>
      </div>
      {/* Name + size */}
      <p className="max-w-[4rem] truncate text-center text-[10px] leading-tight text-muted-foreground" title={doc.fileName}>
        {shortName}
      </p>
      {doc.fileSize ? (
        <p className="text-[9px] text-muted-foreground/60">{formatSize(doc.fileSize)}</p>
      ) : null}
    </div>
  );
}

// ─── AddTile ──────────────────────────────────────────────────────────────────

type AddTileProps = {
  folderId: string;
  productId: number;
  onUploaded: () => void;
  disabled?: boolean;
};

function AddTile({ folderId, productId, onUploaded, disabled }: AddTileProps) {
  const { t, tFormat } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || disabled) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadDocument(productId, folderId, file, t);
      }
      onUploaded();
      toast.success(files.length === 1 ? t("productDocuments.fileAdded") : tFormat("productDocuments.filesAdded", { n: String(files.length) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("productDocuments.uploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [productId, folderId, onUploaded, disabled, t, tFormat]);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={uploading || disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-ring hover:bg-muted/40 disabled:opacity-50"
        aria-label={t("productDocuments.addFile")}
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Plus className="size-5" />
        )}
      </button>
      <p className="text-[10px] text-muted-foreground">{t("productDocuments.add")}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── FolderSection ────────────────────────────────────────────────────────────

type FolderSectionProps = {
  folderId: string;
  label: string;
  docs: ProductDoc[];
  productId: number;
  onRequestDeleteDoc: (doc: ProductDoc) => void;
  onDocUploaded: () => void;
  deletingId: number | null;
  addDisabled?: boolean;
};

function FolderSection({
  folderId,
  label,
  docs,
  productId,
  onRequestDeleteDoc,
  onDocUploaded,
  deletingId,
  addDisabled,
}: FolderSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-muted/40 px-3 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Folder className="size-4 text-amber-500/80" />
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{docs.length}</span>
          {label}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Content */}
      {open && (
        <div className="px-3 py-3 bg-muted/10">
          <div className="flex flex-wrap gap-3">
            {docs.map((doc) => (
              <DocThumbnail
                key={doc.id}
                doc={doc}
                onRequestDelete={onRequestDeleteDoc}
                deleting={deletingId === doc.id}
              />
            ))}
            <AddTile
              folderId={folderId}
              productId={productId}
              onUploaded={onDocUploaded}
              disabled={addDisabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProductDocumentsTab ──────────────────────────────────────────────────────

export type DocumentFolderConfig = { id: string; label: string };

type ProductDocumentsTabProps = {
  /** ID товару (productId) */
  productId: number;
  active: boolean;
  /** Папки з tabConfig табу (якщо порожній масив — показується підказка налаштувати таб). */
  folders?: DocumentFolderConfig[];
  /** Режим прев'ю: показує папки без даних, кнопка додавання вимкнена. */
  previewMode?: boolean;
};

export function ProductDocumentsTab({ productId, active, folders = [], previewMode }: ProductDocumentsTabProps) {
  const { t, tFormat } = useLocale();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [docPendingDelete, setDocPendingDelete] = useState<ProductDoc | null>(null);

  const queryKey = useMemo(() => ["product-documents", productId], [productId]);

  const { data: docs = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchDocuments(productId, t),
    enabled: active && productId > 0,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => deleteDocument(productId, docId, t),
    onMutate: (docId) => setDeletingId(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t("toasts.fileDeleted"));
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setDeletingId(null),
  });

  const handleRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const docsByFolder = folders.reduce<Record<string, ProductDoc[]>>(
    (acc, f) => {
      acc[f.id] = docs.filter((d) => d.folder === f.id);
      return acc;
    },
    {}
  );

  if (!active) return null;

  if (folders.length === 0) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center">
        <p className="text-sm text-muted-foreground px-4 text-center">
          {t("productDocuments.configureFolders")}
        </p>
      </div>
    );
  }

  if (productId === 0 && !previewMode) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center">
        <p className="text-sm text-muted-foreground px-4 text-center">
          {t("productDocuments.saveProductFirst")}
        </p>
      </div>
    );
  }

  if (productId === 0 && previewMode) {
    return (
      <div className="flex flex-col gap-2">
        {folders.map((folder) => (
          <FolderSection
            key={folder.id}
            folderId={folder.id}
            label={folder.label}
            docs={[]}
            productId={0}
            onRequestDeleteDoc={() => {}}
            onDocUploaded={() => {}}
            deletingId={null}
            addDisabled
          />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <ManagementListLoading
        className="min-h-[10rem]"
        screenReaderText={t("users.loading")}
      />
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">{t("productDocuments.loadFailed")}</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-muted-foreground underline">
          {t("productDocuments.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {folders.map((folder) => (
          <FolderSection
            key={folder.id}
            folderId={folder.id}
            label={folder.label}
            docs={docsByFolder[folder.id] ?? []}
            productId={productId}
            onRequestDeleteDoc={(doc) => setDocPendingDelete(doc)}
            onDocUploaded={handleRefetch}
            deletingId={deletingId}
          />
        ))}
      </div>
      <ConfirmDestructiveDialog
        open={docPendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setDocPendingDelete(null);
        }}
        title={t("productDocuments.confirmDeleteTitle")}
        description={
          docPendingDelete
            ? tFormat("productDocuments.confirmDeleteDescription", { fileName: docPendingDelete.fileName })
            : undefined
        }
        cancelLabel={t("productsConfig.common.cancel")}
        confirmLabel={t("users.delete")}
        confirmPending={deleteMutation.isPending}
        onConfirm={() => {
          if (docPendingDelete) deleteMutation.mutate(docPendingDelete.id);
          setDocPendingDelete(null);
        }}
      />
    </>
  );
}
