"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ZoomIn, ZoomOut, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryMediaItem } from "./vehicle-media-gallery";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
const SIDEBAR_THUMB_HEIGHT = 80;
const SIDEBAR_SCROLL_STEP = 80;

type VehicleMediaLightboxProps = {
  items: GalleryMediaItem[];
  initialIndex: number | null;
  onClose: () => void;
  onDelete?: (index: number) => void | Promise<void>;
};

export function VehicleMediaLightbox({
  items,
  initialIndex,
  onClose,
  onDelete,
}: VehicleMediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex ?? 0);
  const [zoom, setZoom] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const open = initialIndex !== null;

  useEffect(() => {
    if (initialIndex !== null) {
      setIndex(initialIndex);
      setZoom(1);
    }
  }, [initialIndex]);

  useEffect(() => {
    if (items.length === 0) return;
    setIndex((i) => Math.min(i, items.length - 1));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    setZoom(1);
  }, [items.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
    setZoom(1);
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  const scrollSidebar = useCallback((direction: "up" | "down") => {
    const el = sidebarRef.current;
    if (!el) return;
    const step = direction === "up" ? -SIDEBAR_SCROLL_STEP : SIDEBAR_SCROLL_STEP;
    el.scrollBy({ top: step, behavior: "smooth" });
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (onDelete == null) return;
    setDeleting(true);
    try {
      await Promise.resolve(onDelete(index));
      setDeleteConfirmOpen(false);
      // Перемикаємо на попереднє фото замість закриття галереї
      setIndex((i) => (i <= 0 ? 0 : i - 1));
    } finally {
      setDeleting(false);
    }
  }, [index, onDelete]);

  useEffect(() => {
    if (!open || !sidebarRef.current || items.length === 0) return;
    const el = sidebarRef.current;
    const clamped = Math.min(index, items.length - 1);
    const thumbTop = clamped * (SIDEBAR_THUMB_HEIGHT + 4);
    const scrollTop = el.scrollTop;
    const scrollBottom = scrollTop + el.clientHeight;
    if (thumbTop < scrollTop) {
      el.scrollTo({ top: Math.max(0, thumbTop - 8), behavior: "smooth" });
    } else if (thumbTop + SIDEBAR_THUMB_HEIGHT > scrollBottom) {
      el.scrollTo({ top: thumbTop - el.clientHeight + SIDEBAR_THUMB_HEIGHT + 8, behavior: "smooth" });
    }
  }, [open, index, items.length]);

  const safeIndex = items.length > 0 ? Math.min(index, items.length - 1) : 0;
  const current = items[safeIndex];

  if (items.length === 0 || current == null) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="!left-[2.5rem] !top-[1rem] !right-[2.5rem] !bottom-[1rem] !translate-x-0 !translate-y-0 !w-auto !h-auto !max-w-none flex flex-col gap-0 overflow-hidden p-0 select-none rounded-lg border shadow-lg"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Перегляд фото та відео</DialogTitle>
          <div className="flex flex-1 min-h-0">
            {/* Ліва панель — тільки на ПК; на смартфонах лише горизонтальне гортання */}
            <aside className="hidden md:flex w-36 shrink-0 flex-col border-r bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-none"
                aria-label="Гортати мініатюри вгору"
                onClick={() => scrollSidebar("up")}
              >
                <ChevronUp className="size-4" />
              </Button>
              <div
                ref={sidebarRef}
                className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2 min-h-0"
              >
                {items.map((item, i) => {
                  const isActive = i === safeIndex;
                  return (
                    <button
                      key={`${item.path}-${i}`}
                      type="button"
                      className={cn(
                        "flex w-full shrink-0 overflow-hidden rounded border-2 transition-colors",
                        isActive ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                      )}
                      style={{ height: SIDEBAR_THUMB_HEIGHT, minHeight: SIDEBAR_THUMB_HEIGHT }}
                      onClick={() => {
                        setIndex(i);
                        setZoom(1);
                      }}
                    >
                      {item.kind === "video" ? (
                        <video src={item.path} className="size-full object-contain pointer-events-none bg-muted/50" muted draggable={false} playsInline preload="metadata" />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element -- dynamic blob/external URLs */
                        <img src={item.path} alt="" className="size-full object-contain pointer-events-none bg-muted/50" draggable={false} loading="lazy" />
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-none"
                aria-label="Гортати мініатюри вниз"
                onClick={() => scrollSidebar("down")}
              >
                <ChevronDown className="size-4" />
              </Button>
            </aside>

            {/* Права панель — велике зображення/відео + zoom + закрити + видалити */}
            <div className="relative flex flex-1 flex-col min-w-0">
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  disabled={zoom <= ZOOM_MIN}
                >
                  <ZoomOut className="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  disabled={zoom >= ZOOM_MAX}
                >
                  <ZoomIn className="size-4" />
                </Button>
                {onDelete != null && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={handleDeleteClick}
                    aria-label="Видалити фото"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={onClose}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex flex-1 min-h-0 items-center justify-center overflow-auto bg-black/5 p-2">
                {current.kind === "video" ? (
                  <video
                    key={current.path}
                    src={current.path}
                    controls
                    className="w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center overflow-auto" style={{ transform: `scale(${zoom})` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic blob/external URLs */}
                    <img
                      key={current.path}
                      src={current.path}
                      alt=""
                      className="w-full max-h-full object-contain"
                      draggable={false}
                      style={{ transformOrigin: "center center" }}
                    />
                  </div>
                )}
              </div>

              {items.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 size-10 -translate-y-1/2 rounded-full"
                    onClick={goPrev}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 size-10 -translate-y-1/2 rounded-full"
                    onClick={goNext}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </>
              )}

              <p className="border-t px-4 py-1 text-center text-xs text-muted-foreground">
                {safeIndex + 1} / {items.length}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити фото?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію не можна скасувати. Фото буде видалено з картки авто.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Видалення…" : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
