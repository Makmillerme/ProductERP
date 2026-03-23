"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/config/roles";
import type { AdminUser } from "./types";
import { formatDateForDisplay } from "@/features/products/lib/field-utils";

type UsersTableProps = {
  users: AdminUser[];
  currentUserId: string | undefined;
  roleLabels?: Record<string, string>;
  onRowClick: (user: AdminUser) => void;
};

export function UsersTable({
  users,
  currentUserId,
  roleLabels,
  onRowClick,
}: UsersTableProps) {
  const { t } = useLocale();
  void currentUserId; // Reserved for highlighting current user row
  return (
    <div className="overflow-hidden">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.email")}</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.name")}</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.lastName")}</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.role")}</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.status")}</TableHead>
            <TableHead className="h-11 px-3 text-left align-middle">{t("users.registrationDate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                plain
                colSpan={6}
                className="h-24 align-middle"
              >
                <div className="flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 py-10 text-center">
                  <p className="text-sm text-muted-foreground px-4">
                    {t("users.emptySearch")}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={cn("cursor-pointer hover:bg-muted/50")}
                onClick={() => onRowClick(user)}
              >
                <TableCell className="h-11 px-3 text-left align-middle font-medium truncate" title={user.email}>
                  {user.email}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle truncate" title={user.name || undefined}>
                  {user.name || "—"}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle truncate" title={user.lastName ?? undefined}>
                  {user.lastName ?? "—"}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle">
                  {getRoleLabel(user.role ?? undefined, roleLabels?.[user.role ?? ""])}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle">
                  {user.banned === true ? (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-destructive/15 text-destructive")}>
                      {t("users.statusBanned")}
                    </span>
                  ) : (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground")}>
                      {t("users.statusActive")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-xs">
                  {formatDateForDisplay(user.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
