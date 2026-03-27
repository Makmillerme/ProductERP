"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { ADMIN_ROLE, ADMIN_LABEL, OWNER_ROLE, OWNER_LABEL } from "@/config/roles";
import { TableWithPagination } from "@/components/table-with-pagination";
import { TablePaginationBar } from "@/components/table-pagination-bar";
import { ManagementListLoading } from "@/components/management-list-states";
import { UsersTable } from "./users-table";
import { UserDetailSheet } from "./user-detail-sheet";
import { BanUserDialog } from "./ban-user-dialog";
import { UnbanUserDialog } from "./unban-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { AdminUser } from "./types";
import { managementAdminKeys } from "@/lib/query-keys";

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

async function fetchRolesForSelect(): Promise<{ code: string; name: string }[]> {
  const res = await fetch("/api/roles");
  if (!res.ok) return [];
  const data = await res.json();
  const list = (data?.roles ?? []) as { code: string; name: string }[];
  const fromApi = list.filter((r) => r.code !== ADMIN_ROLE && r.code !== OWNER_ROLE).map((r) => ({ code: r.code, name: r.name }));
  return [{ code: ADMIN_ROLE, name: ADMIN_LABEL }, ...fromApi];
}

function useUsersList(
  params: {
    search: string;
    sortBy: string;
    sortDirection: "asc" | "desc";
    limit: number;
    offset: number;
  },
  t: (key: string) => string
) {
  return useQuery({
    queryKey: [...managementAdminKeys.users, params],
    queryFn: async () => {
      const searchValue = params.search.trim() || undefined;
      const searchField = searchValue?.includes("@") ? "email" : "name";
      const res = await authClient.admin.listUsers({
        query: {
          searchValue,
          searchField: searchValue ? searchField : undefined,
          searchOperator: "contains",
          limit: params.limit,
          offset: params.offset,
          sortBy: params.sortBy || "createdAt",
          sortDirection: params.sortDirection,
        },
      });
      if (res.error) throw new Error(res.error.message ?? t("errors.loadFailed"));
      const data = res.data as unknown as { users?: AdminUser[]; total?: number };
      return {
        users: data?.users ?? [],
        total: data?.total ?? 0,
        limit: params.limit,
        offset: params.offset,
      };
    },
    staleTime: 30 * 1000,
  });
}

export function UsersManagement() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: sessionData, isPending: sessionPending } = useSession();
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) return { user: null, isOwner: false };
      return res.json() as Promise<{ user: unknown; isOwner: boolean }>;
    },
    enabled: !!sessionData?.user,
  });
  const isOwner = meData?.isOwner === true;
  const isAdmin = sessionData?.user?.role === ADMIN_ROLE || sessionData?.user?.role === OWNER_ROLE || isOwner;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy] = useState("createdAt");
  const [sortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageInputValue, setPageInputValue] = useState(String(page));

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<"profile" | "sessions">("profile");
  const [banUser, setBanUser] = useState<AdminUser | null>(null);
  const [unbanUser, setUnbanUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const offset = (page - 1) * pageSize;
  const listParams = useMemo(
    () => ({
      search,
      sortBy,
      sortDirection,
      limit: pageSize,
      offset,
    }),
    [search, sortBy, sortDirection, pageSize, offset]
  );

  const { data, isLoading, isError, error } = useUsersList(listParams, t);
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const { data: rolesList = [] } = useQuery({
    queryKey: managementAdminKeys.roles,
    queryFn: fetchRolesForSelect,
    enabled: isAdmin,
  });

  const roleOptions = useMemo(() => {
    if (isOwner) return rolesList;
    return rolesList.filter((r) => r.code !== ADMIN_ROLE);
  }, [rolesList, isOwner]);

  const roleLabels = useMemo(() => {
    const m: Record<string, string> = { [ADMIN_ROLE]: ADMIN_LABEL, [OWNER_ROLE]: OWNER_LABEL };
    for (const r of rolesList) {
      m[r.code] = r.name;
    }
    return m;
  }, [rolesList]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  useEffect(() => {
    setPageInputValue(String(page));
  }, [page]);

  const handlePageInputBlur = useCallback(() => {
    const n = parseInt(pageInputValue, 10);
    const clamped = Number.isNaN(n) ? page : Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setPageInputValue(String(clamped));
  }, [pageInputValue, totalPages, page]);

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePageInputBlur();
  }, [handlePageInputBlur]);

  const goToPage = useCallback((p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
  }, [totalPages]);

  const invalidateUsersList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: managementAdminKeys.users });
  }, [queryClient]);

  const onSuccessBan = useCallback(() => {
    invalidateUsersList();
    setSelectedUser(null);
    toast.success(t("toasts.userBanned"));
  }, [invalidateUsersList, t]);

  const onSuccessUnban = useCallback(() => {
    invalidateUsersList();
    setSelectedUser(null);
    toast.success(t("toasts.userUnbanned"));
  }, [invalidateUsersList, t]);

  const onSuccessDelete = useCallback(() => {
    invalidateUsersList();
    setSelectedUser(null);
    toast.success(t("toasts.userDeleted"));
  }, [invalidateUsersList, t]);

  if (sessionPending) return null;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-muted/50 bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          {t("users.requireAdmin")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Панель пошуку та дій — як на обліку авто: одна висота, кнопка лише іконка */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("users.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("users.addUser")}
          onClick={() => {
            setCreateOpen(true);
            setSelectedUser(null);
          }}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t("errors.loadFailed")}
        </p>
      )}

      {isLoading ? (
        <ManagementListLoading screenReaderText={t("users.loading")} />
      ) : (
        <>
          <TableWithPagination
            pagination={
              <TablePaginationBar
                page={page}
                totalPages={totalPages}
                pageInputValue={pageInputValue}
                onPageInputChange={setPageInputValue}
                onPageInputBlur={handlePageInputBlur}
                onPageInputKeyDown={handlePageInputKeyDown}
                goToPage={goToPage}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            }
        >
          <UsersTable
            users={users}
            currentUserId={sessionData?.user?.id}
            roleLabels={roleLabels}
            onRowClick={(u) => {
              setCreateOpen(false);
              setSelectedUser(u);
              setSheetInitialTab("profile");
            }}
          />
        </TableWithPagination>
        </>
      )}

      <UserDetailSheet
        user={createOpen ? null : selectedUser}
        open={createOpen || selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setSelectedUser(null);
          }
        }}
        initialTab={sheetInitialTab}
        currentUserId={sessionData?.user?.id}
        currentUserRole={sessionData?.user?.role as string | undefined}
        isOwner={isOwner}
        roleOptions={roleOptions}
        onSuccess={(isCreate) => {
          invalidateUsersList();
          toast.success(isCreate ? t("users.userCreated") : t("users.userUpdated"));
        }}
        onRequestBan={setBanUser}
        onRequestUnban={setUnbanUser}
        onRequestDelete={setDeleteUser}
        onTransferSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["me"] });
          invalidateUsersList();
        }}
      />
      <BanUserDialog
        open={banUser !== null}
        onOpenChange={(open) => !open && setBanUser(null)}
        user={banUser}
        onSuccess={onSuccessBan}
      />
      <UnbanUserDialog
        open={unbanUser !== null}
        onOpenChange={(open) => !open && setUnbanUser(null)}
        user={unbanUser}
        onSuccess={onSuccessUnban}
      />
      <DeleteUserDialog
        open={deleteUser !== null}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
        currentUserId={sessionData?.user?.id}
        onSuccess={onSuccessDelete}
      />
    </div>
  );
}
