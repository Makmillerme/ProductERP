"use client";

import { cn } from "@/lib/utils";

type TableWithPaginationProps = {
  children: React.ReactNode;
  pagination?: React.ReactNode;
  className?: string;
};

/**
 * Уніфікований контейнер для таблиць з опційною пагінацією.
 * Таблиця та пагінація об'єднані в один візуальний блок.
 */
export function TableWithPagination({
  children,
  pagination,
  className,
}: TableWithPaginationProps) {
  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden",
        className
      )}
    >
      <div className="p-2">{children}</div>
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 bg-muted/20">
          {pagination}
        </div>
      )}
    </div>
  );
}
