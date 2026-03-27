"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TabsList } from "@/components/ui/tabs";

const SCROLL_STEP = 120;
/** Уникаємо флікеру canScroll* через дробові пікселі та зміну ширини після зникнення оверлею. */
const EDGE_EPS = 2;

type ScrollableTabsListProps = React.ComponentProps<typeof TabsList>;

export function ScrollableTabsList({
  className,
  children,
  ...props
}: ScrollableTabsListProps) {
  const { t } = useLocale();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const overflow = maxScroll > EDGE_EPS;
    setHasOverflow(overflow);
    if (!overflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > EDGE_EPS);
    setCanScrollRight(el.scrollLeft < maxScroll - EDGE_EPS);
  }, []);

  React.useLayoutEffect(() => {
    updateScrollState();
  }, [updateScrollState, children]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onFrame = () => requestAnimationFrame(updateScrollState);

    updateScrollState();
    const ro = new ResizeObserver(onFrame);
    ro.observe(el);
    el.addEventListener("scroll", onFrame, { passive: true });
    el.addEventListener("scrollend", onFrame);

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onFrame);
      el.removeEventListener("scrollend", onFrame);
    };
  }, [updateScrollState, children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const delta = direction === "left" ? -SCROLL_STEP : SCROLL_STEP;
    let target = el.scrollLeft + delta;
    if (direction === "right") {
      target = Math.min(maxScroll, target);
      if (maxScroll - target < SCROLL_STEP * 0.55) {
        target = maxScroll;
      }
    } else {
      target = Math.max(0, target);
    }
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <div className="flex w-full min-w-0 shrink-0 items-center gap-1">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          hasOverflow
            ? "w-8"
            : "pointer-events-none w-0 min-w-0 overflow-hidden opacity-0 select-none",
        )}
        aria-hidden={!hasOverflow}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!hasOverflow || !canScrollLeft}
          onClick={() => scroll("left")}
          aria-label={t("scrollableTabs.scrollLeft")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="min-w-0 flex-1 overflow-x-auto scroll-smooth pb-1.5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <TabsList
          className={cn(
            "inline-flex w-max max-w-none shrink-0 flex-nowrap justify-start gap-2",
            className,
          )}
          {...props}
        >
          {children}
        </TabsList>
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          hasOverflow
            ? "w-8"
            : "pointer-events-none w-0 min-w-0 overflow-hidden opacity-0 select-none",
        )}
        aria-hidden={!hasOverflow}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!hasOverflow || !canScrollRight}
          onClick={() => scroll("right")}
          aria-label={t("scrollableTabs.scrollRight")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
