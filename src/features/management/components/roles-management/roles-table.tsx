"use client";

import { useLocale } from "@/lib/locale-provider";
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
  MGMT_COLGROUP_5_ROLES,
  mgmtTableLayoutClass,
  mgmtTableHeaderRowClass,
  mgmtTableHeadClass,
  mgmtTableCellPrimaryClass,
  mgmtTableCellMutedSmClass,
  mgmtTableCellMutedXsClass,
  mgmtTableCellNumericClass,
} from "@/config/management-table";
import { TableEmptyMessageRow } from "@/components/management-list-states";
import { cn } from "@/lib/utils";
import { ADMIN_SYSTEM_ROLE_ID } from "@/config/roles";
import type { ApiRoleListItem } from "./types";
import { formatDateForDisplay } from "@/features/products/lib/field-utils";

type RolesTableProps = {
  roles: ApiRoleListItem[];
  totalCount?: number;
  onRowClick: (role: ApiRoleListItem) => void;
};

export function RolesTable({
  roles,
  totalCount,
  onRowClick,
}: RolesTableProps) {
  const { t } = useLocale();
  const isEmpty = roles.length === 0;
  const emptyMessage =
    totalCount === 0
      ? t("roles.emptyCreate")
      : t("common.emptySearch");

  const isSystemAdmin = (role: ApiRoleListItem) => role.id === ADMIN_SYSTEM_ROLE_ID;
  return (
    <>
      <Table className={mgmtTableLayoutClass}>
        <MgmtTableColGroup widths={MGMT_COLGROUP_5_ROLES} />
        <TableHeader>
          <TableRow className={mgmtTableHeaderRowClass}>
            <TableHead className={mgmtTableHeadClass}>{t("roles.name")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("roles.code")}</TableHead>
            <TableHead className={`${mgmtTableHeadClass} hidden md:table-cell`}>{t("roles.description")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("roles.createdAt")}</TableHead>
            <TableHead className={mgmtTableHeadClass}>{t("roles.permissionsCount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableEmptyMessageRow colSpan={5}>{emptyMessage}</TableEmptyMessageRow>
          ) : (
            roles.map((role) => (
              <TableRow
                key={role.id || role.code}
                className={cn("cursor-pointer hover:bg-muted/50")}
                onClick={() => onRowClick(role)}
              >
                <TableCell className={mgmtTableCellPrimaryClass} title={role.name}>
                  <TableCellText>{role.name}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellMutedSmClass} title={role.code}>
                  <TableCellText>{role.code}</TableCellText>
                </TableCell>
                <TableCell
                  className={`${mgmtTableCellMutedSmClass} hidden md:table-cell`}
                  title={role.description ?? undefined}
                >
                  <TableCellText>{role.description ?? "—"}</TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellMutedXsClass}>
                  <TableCellText>
                    {isSystemAdmin(role) ? "—" : formatDateForDisplay(role.createdAt)}
                  </TableCellText>
                </TableCell>
                <TableCell className={mgmtTableCellNumericClass}>
                  <TableCellText className="tabular-nums">
                    {isSystemAdmin(role) ? t("roles.allPermissions") : role.permissionsCount}
                  </TableCellText>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
