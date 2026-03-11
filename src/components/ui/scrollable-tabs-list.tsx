"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TabsList } from "@/components/ui/tabs";

const SCROLL_STEP = 120;

type ScrollableTabsListProps = React.ComponentProps<typeof TabsList>;

export function ScrollableTabsList({
  className,
  children,
  ...props
}: ScrollableTabsListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -SCROLL_STEP : SCROLL_STEP, behavior: "smooth" });
  };

  return (
    <div className="relative flex w-full shrink-0 items-center">
      {canScrollLeft && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 z-10 h-7 w-6 -translate-y-1/2 shrink-0 rounded-md bg-background/80 shadow-md backdrop-blur hover:bg-muted"
          onClick={() => scroll("left")}
          aria-label="Прокрутити таби вліво"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-x-auto overflow-y-hidden scroll-smooth [&::-webkit-scrollbar]:hidden",
          canScrollLeft && "pl-6",
          canScrollRight && "pr-6"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <TabsList className={cn("w-fit min-w-full", className)} {...props}>
          {children}
        </TabsList>
      </div>
      {canScrollRight && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 z-10 h-7 w-6 -translate-y-1/2 shrink-0 rounded-md bg-background/80 shadow-md backdrop-blur hover:bg-muted"
          onClick={() => scroll("right")}
          aria-label="Прокрутити таби вправо"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
