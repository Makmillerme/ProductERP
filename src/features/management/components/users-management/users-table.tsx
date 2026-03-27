"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableCellText,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MgmtTableColGroup } from "@/components/mgmt-table-colgroup";
import {
  MGMT_COLGROUP_6_USERS,
  mgmtTableLayoutClass,
  mgmtTableHeaderRowClass,
  mgmtTableHeadClass,
  mgmtTableCellClass,
  mgmtTableCellPrimaryClass,
  mgmtTableCellMutedXsClass,
} from "@/config/management-table";
import { TableEmptyMessageRow } from "@/components/management-list-states";
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
    <>
      <Table className={mgmtTableLayoutClass}>
        <MgmtTableColGroup widths={MGMT_COLGROUP_6_USERS} />
        <TableHeader>
          <TableRow className={mgmtTableHeaderRowClass}>
            <TableHead className={mgmtTableHeadClass}>{t("users.email")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("users.name")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("users.lastName")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("users.role")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("users.status")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("users.registrationDate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableEmptyMessageRow colSpan={6}>{t("users.emptySearch")}</TableEmptyMessageRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={cn("cursor-pointer hover:bg-muted/50")}
                onClick={() => onRowClick(user)}
              >
                <TableCell className={mgmtTableCellPrimaryClass} title={user.email}>
                  <TableCellText>{user.email}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellClass} title={user.name || undefined}>
                  <TableCellText>{user.name || "—"}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellClass} title={user.lastName ?? undefined}>
                  <TableCellText>{user.lastName ?? "—"}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellClass} title={getRoleLabel(user.role ?? undefined, roleLabels?.[user.role ?? ""])}>
                  <TableCellText>{getRoleLabel(user.role ?? undefined, roleLabels?.[user.role ?? ""])}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellClass}>
                  {user.banned === true ? (
                    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium bg-destructive/15 text-destructive")}>
                      {t("users.statusBanned")}
                    </span>
                  ) : (
                    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground")}>
                      {t("users.statusActive")}
                    </span>
                  )}
                </TableCell>
                <TableCell className={mgmtTableCellMutedXsClass}>
                  <TableCellText>{formatDateForDisplay(user.createdAt)}</TableCellText>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
