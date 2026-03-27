"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

export type TablePaginationBarProps = {
  page: number;
  totalPages: number;
  pageInputValue: string;
  onPageInputChange: (value: string) => void;
  onPageInputBlur: () => void;
  onPageInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  goToPage: (page: number) => void;
  pageSize: number;
  pageSizes: readonly number[];
  onPageSizeChange: (size: number) => void;
  /** When false, navigation is locked and the page field shows 1 / 1 (e.g. before hydration). */
  isReady?: boolean;
  /** Disables pagination while list data is loading. */
  isLoading?: boolean;
  /** Extra class for the page-size dropdown content. */
  pageSizeMenuContentClassName?: string;
};

const BTN_ICON =
  "flex items-center justify-center [&_svg]:block [&_svg]:m-auto";

/**
 * Shared table footer: first/prev/page input/next/last + rows-per-page selector.
 * Use inside {@link TableWithPagination}'s `pagination` slot.
 */
export function TablePaginationBar({
  page,
  totalPages,
  pageInputValue,
  onPageInputChange,
  onPageInputBlur,
  onPageInputKeyDown,
  goToPage,
  pageSize,
  pageSizes,
  onPageSizeChange,
  isReady = true,
  isLoading = false,
  pageSizeMenuContentClassName,
}: TablePaginationBarProps) {
  const { t } = useLocale();

  const safeTotalPages = isReady ? totalPages : 1;
  const safePageValue = isReady ? pageInputValue : "1";
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const navBackDisabled = !isReady || isLoading || !canPrev;
  const navForwardDisabled = !isReady || isLoading || !canNext;
  const pageSizeDisabled = isReady && isLoading;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={BTN_ICON}
          aria-label={t("common.pagination.ariaFirstPage")}
          disabled={navBackDisabled}
          onClick={() => goToPage(1)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={BTN_ICON}
          aria-label={t("common.pagination.ariaPrevPage")}
          disabled={navBackDisabled}
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
          {t("common.pagination.page")}
          <Input
            type="number"
            min={1}
            max={safeTotalPages}
            value={safePageValue}
            onChange={(e) => onPageInputChange(e.target.value)}
            onBlur={onPageInputBlur}
            onKeyDown={onPageInputKeyDown}
            className="h-8 w-14 text-center"
            aria-label={t("common.pagination.ariaPageNumber")}
          />
          {t("common.pagination.pageOf")} {safeTotalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={BTN_ICON}
          aria-label={t("common.pagination.ariaNextPage")}
          disabled={navForwardDisabled}
          onClick={() => goToPage(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={BTN_ICON}
          aria-label={t("common.pagination.ariaLastPage")}
          disabled={navForwardDisabled}
          onClick={() => goToPage(totalPages)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t("common.pagination.rowsPerPage")}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="default"
              className="gap-2 min-w-[4.5rem] justify-between"
              disabled={pageSizeDisabled}
              aria-label={t("common.pagination.ariaRowsPerPage")}
            >
              {pageSize}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn("min-w-[4.5rem]", pageSizeMenuContentClassName)}
          >
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              {pageSizes.map((n) => (
                <DropdownMenuRadioItem key={n} value={String(n)}>
                  {n}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
