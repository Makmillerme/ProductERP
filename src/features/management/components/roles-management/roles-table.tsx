"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ADMIN_SYSTEM_ROLE_ID } from "@/config/roles";
import type { ApiRoleListItem } from "./types";

type RolesTableProps = {
  roles: ApiRoleListItem[];
  totalCount?: number;
  onRowClick: (role: ApiRoleListItem) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("uk-UA", { dateStyle: "short" });
}

export function RolesTable({
  roles,
  totalCount,
  onRowClick,
}: RolesTableProps) {
  const isEmpty = roles.length === 0;
  const emptyMessage =
    totalCount === 0
      ? "Ще немає ролей. Натисніть кнопку «+», щоб додати першу роль."
      : "За пошуком нічого не знайдено.";

  const isSystemAdmin = (role: ApiRoleListItem) => role.id === ADMIN_SYSTEM_ROLE_ID;
  return (
    <div className="overflow-hidden">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="h-11 px-3 text-left align-middle">Назва</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">Код</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle hidden md:table-cell">Опис</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">Дата створення</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle w-24">Прав</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow key="empty" className="hover:bg-transparent">
              <TableCell
                plain
                colSpan={5}
                className="h-24 align-middle"
              >
                <div className="flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 py-10 text-center">
                  <p className="text-sm text-muted-foreground px-4">
                    {emptyMessage}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow
                key={role.id || role.code}
                className={cn("cursor-pointer hover:bg-muted/50")}
                onClick={() => onRowClick(role)}
              >
                <TableCell className="h-11 px-3 text-left align-middle font-medium">
                  {role.name}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm">
                  {role.code}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm truncate hidden md:table-cell" title={role.description ?? undefined}>
                  {role.description ?? "—"}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-xs">
                  {isSystemAdmin(role) ? "—" : formatDate(role.createdAt)}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm tabular-nums">
                  {isSystemAdmin(role) ? "усі" : role.permissionsCount}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
