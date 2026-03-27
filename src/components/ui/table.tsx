"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto scroll-smooth"
    >
      <table
        data-slot="table"
        className={cn(
          "caption-bottom text-sm table-auto min-w-full w-max max-w-none",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, children, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-11 p-0 font-medium align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex min-h-11 w-full min-w-0 items-center leading-none",
          className?.includes("text-center") && "justify-center",
          className?.includes("text-right") && "justify-end"
        )}
      >
        {className?.includes("whitespace-nowrap") ? (
          children
        ) : (
          <span className="min-w-0 truncate leading-tight">{children}</span>
        )}
      </div>
    </th>
  )
}

/** Текст у комірці: обрізання в межах колонки (разом із `max-w-0` на `td`). */
function TableCellText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("min-w-0 flex-1 truncate text-left", className)}
      {...props}
    />
  )
}

function TableCell({ className, children, plain, ...props }: React.ComponentProps<"td"> & { plain?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-0 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      {plain ? (
        children
      ) : (
        <div className="flex h-11 min-h-11 w-full min-w-0 max-w-full items-center gap-1.5 overflow-hidden">
          {children}
        </div>
      )}
    </td>
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCellText,
  TableCaption,
}
