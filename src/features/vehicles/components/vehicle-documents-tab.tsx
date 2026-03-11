"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, FileText, FileImage, FileVideo, File, X, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleDoc } from "@/config/vehicle-documents";

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchDocuments(productId: number): Promise<VehicleDoc[]> {
  const res = await fetch(`/api/products/${productId}/documents`);
  if (!res.ok) throw new Error("Помилка завантаження документів");
  const data = await res.json();
  return data.documents ?? [];
}

async function uploadDocument(productId: number, folder: string, file: File): Promise<VehicleDoc> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch(`/api/products/${productId}/documents`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Помилка завантаження");
  return data as VehicleDoc;
}

async function deleteDocument(productId: number, docId: number): Promise<void> {
  const res = await fetch(`/api/products/${productId}/documents/${docId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення");
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
  doc: VehicleDoc;
  onDelete: (id: number) => void;
  deleting: boolean;
};

function DocThumbnail({ doc, onDelete, deleting }: DocThumbnailProps) {
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
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
          className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/80 disabled:opacity-50"
          aria-label="Видалити"
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
};

function AddTile({ folderId, productId, onUploaded }: AddTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadDocument(productId, folderId, file);
      }
      onUploaded();
      toast.success(files.length === 1 ? "Файл додано" : `Додано ${files.length} файли`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [productId, folderId, onUploaded]);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-ring hover:bg-muted/40 disabled:opacity-50"
        aria-label="Додати файл"
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Plus className="size-5" />
        )}
      </button>
      <p className="text-[10px] text-muted-foreground">Додати</p>
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
  docs: VehicleDoc[];
  productId: number;
  onDocDeleted: (id: number) => void;
  onDocUploaded: () => void;
  deletingId: number | null;
};

function FolderSection({
  folderId,
  label,
  docs,
  productId,
  onDocDeleted,
  onDocUploaded,
  deletingId,
}: FolderSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{docs.length}</span>
          {label}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Content */}
      {open && (
        <div className="px-3 py-3">
          <div className="flex flex-wrap gap-3">
            {docs.map((doc) => (
              <DocThumbnail
                key={doc.id}
                doc={doc}
                onDelete={onDocDeleted}
                deleting={deletingId === doc.id}
              />
            ))}
            <AddTile folderId={folderId} productId={productId} onUploaded={onDocUploaded} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VehicleDocumentsTab ──────────────────────────────────────────────────────

export type DocumentFolderConfig = { id: string; label: string };

type VehicleDocumentsTabProps = {
  /** ID товару (productId) */
  vehicleId: number;
  active: boolean;
  /** Папки з tabConfig табу (якщо порожній масив — показується підказка налаштувати таб). */
  folders?: DocumentFolderConfig[];
};

export function VehicleDocumentsTab({ vehicleId, active, folders = [] }: VehicleDocumentsTabProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryKey = useMemo(() => ["product-documents", vehicleId], [vehicleId]);

  const { data: docs = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchDocuments(vehicleId),
    enabled: active && vehicleId > 0,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => deleteDocument(vehicleId, docId),
    onMutate: (docId) => setDeletingId(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Файл видалено");
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setDeletingId(null),
  });

  const handleRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const docsByFolder = folders.reduce<Record<string, VehicleDoc[]>>(
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
          Налаштуйте папки документів у визначенні поля «Файли» (Модель даних → Поля).
        </p>
      </div>
    );
  }

  if (vehicleId === 0) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center">
        <p className="text-sm text-muted-foreground px-4 text-center">
          Збережіть авто, щоб додавати документи.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">Помилка завантаження документів.</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-muted-foreground underline">
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {folders.map((folder) => (
        <FolderSection
          key={folder.id}
          folderId={folder.id}
          label={folder.label}
          docs={docsByFolder[folder.id] ?? []}
          productId={vehicleId}
          onDocDeleted={(id) => deleteMutation.mutate(id)}
          onDocUploaded={handleRefetch}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
}
