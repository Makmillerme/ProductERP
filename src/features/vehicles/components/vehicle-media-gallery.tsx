"use client";

import { useState, useCallback, memo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Upload } from "lucide-react";
import { VehicleMediaLightbox } from "./vehicle-media-lightbox";

/** Фіксована висота мініатюр, ширина за масштабом зображення (динамічна) */
const CAROUSEL_THUMB_HEIGHT = "11rem";

export type GalleryMediaItem = { path: string; kind: "image" | "video" };

type VehicleMediaGalleryProps = {
  items: GalleryMediaItem[];
  onDelete?: (index: number) => void | Promise<void>;
  /** Клік по картці «Додати» в кінці каруселі — відкриває діалог вибору файлів. */
  onAddClick?: () => void;
  addDisabled?: boolean;
};

export const VehicleMediaGallery = memo(function VehicleMediaGallery({ items, onDelete, onAddClick, addDisabled }: VehicleMediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const showAddSlot = onAddClick != null;
  const hasItems = items.length > 0;

  if (!hasItems && !showAddSlot) return null;

  return (
    <>
      <Carousel
        opts={{ align: "start", loop: false }}
        className="w-full relative select-none"
      >
        <CarouselContent className="-ml-2">
          {items.map((item, index) => (
            <CarouselItem
              key={item.path || `item-${index}`}
              className="pl-2 shrink-0 !basis-auto"
              style={{ height: CAROUSEL_THUMB_HEIGHT }}
            >
              <button
                type="button"
                className="inline-flex h-full overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => openLightbox(index)}
              >
                {item.kind === "video" ? (
                  <video
                    src={item.path}
                    className="h-full w-auto object-contain pointer-events-none"
                    muted
                    preload="metadata"
                    draggable={false}
                    playsInline
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- dynamic blob/external URLs */
                  <img
                    src={item.path}
                    alt=""
                    className="h-full w-auto object-contain pointer-events-none"
                    draggable={false}
                    loading="lazy"
                  />
                )}
              </button>
            </CarouselItem>
          ))}
          {showAddSlot && (
            <CarouselItem
              className="pl-2 shrink-0 !basis-auto"
              style={{ height: CAROUSEL_THUMB_HEIGHT }}
            >
              <button
                type="button"
                disabled={addDisabled}
                className="inline-flex h-full w-[11rem] items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onAddClick()}
                aria-label="Додати фото або відео"
              >
                <Upload className="size-8" />
                <span className="text-xs font-medium">Додати фото</span>
              </button>
            </CarouselItem>
          )}
        </CarouselContent>
        {items.length > 1 && (
          <>
            <div
              className="absolute left-0 top-1/2 size-8 -translate-y-1/2 z-10"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-hidden
            >
              <CarouselPrevious className="left-0 rounded-full bg-background/80 hover:bg-background" />
            </div>
            <div
              className="absolute right-0 top-1/2 size-8 -translate-y-1/2 z-10"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-hidden
            >
              <CarouselNext className="right-0 rounded-full bg-background/80 hover:bg-background" />
            </div>
          </>
        )}
      </Carousel>
      {hasItems && lightboxIndex !== null && (
        <VehicleMediaLightbox
          items={items}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
          onDelete={onDelete}
        />
      )}
    </>
  );
});
