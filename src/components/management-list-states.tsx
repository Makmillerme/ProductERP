"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ManagementListLoading({
  className,
  screenReaderText,
}: {
  className?: string;
  /** Текст для скрінрідерів (наприклад ключ локалізації «завантаження»). */
  screenReaderText?: string;
} = {}) {
  return (
    <div
      className={cn("flex items-center justify-center py-12", className)}
      role="status"
      aria-busy="true"
      aria-label={screenReaderText}
    >
      {screenReaderText ? (
        <span className="sr-only">{screenReaderText}</span>
      ) : null}
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
    </div>
  );
}

type TableEmptyMessageRowProps = {
  colSpan: number;
  children: ReactNode;
};

/** Єдиний порожній рядок для management-таблиць (заголовок таблиці лишається видимим). */
export function TableEmptyMessageRow({ colSpan, children }: TableEmptyMessageRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell plain colSpan={colSpan} className="h-24 align-middle">
        <div className="flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="text-sm text-muted-foreground px-4">{children}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
