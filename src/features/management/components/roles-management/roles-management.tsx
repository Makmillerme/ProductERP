"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { type RolePermissionsMap } from "@/config/permissions";
import { PERMISSION_SECTIONS, TOTAL_PERMISSIONS_COUNT } from "@/config/permissions";
import { ADMIN_LABEL, ADMIN_ROLE, ADMIN_SYSTEM_ROLE_ID, OWNER_ROLE } from "@/config/roles";
import { TableWithPagination } from "@/components/table-with-pagination";
import { RolesTable } from "./roles-table";
import { RoleDetailSheet } from "./role-detail-sheet";
import type { ApiRoleListItem, ApiRoleDetail } from "./types";

const ROLES_QUERY_KEY = ["admin", "roles"] as const;

type TFn = (key: string) => string;

async function fetchRoles(t: TFn): Promise<ApiRoleListItem[]> {
  const res = await fetch("/api/roles");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("errors.loadFailed"));
  }
  const data = await res.json();
  return data.roles ?? [];
}

async function fetchRoleDetail(id: string, t: TFn): Promise<ApiRoleDetail> {
  const res = await fetch(`/api/roles/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("errors.loadFailed"));
  }
  return res.json();
}

async function createRole(
  body: {
    name: string;
    code: string;
    description?: string | null;
    permissions?: RolePermissionsMap;
  },
  t: TFn
) {
  const res = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.name,
      code: body.code,
      description: body.description ?? null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("errors.createFailed"));
  const roleId = data.id;
  if (roleId && body.permissions && Object.keys(body.permissions).length > 0) {
    const patchRes = await fetch(`/api/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: body.permissions }),
    });
    const patchData = await patchRes.json().catch(() => ({}));
    if (!patchRes.ok) throw new Error(patchData?.error ?? t("errors.saveFailed"));
  }
  return data;
}

async function updateRole(
  id: string,
  body: { name?: string; description?: string | null; permissions: RolePermissionsMap },
  t: TFn
) {
  const res = await fetch(`/api/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("errors.saveFailed"));
  return data;
}

export function RolesManagement() {
  const { t } = useLocale();
  const { data: sessionData, isPending: sessionPending } = useSession();
  const isAdmin = sessionData?.user?.role === ADMIN_ROLE || sessionData?.user?.role === OWNER_ROLE;
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data: roles = [], isLoading, isError, error } = useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => fetchRoles(t),
    enabled: isAdmin,
  });

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.trim().toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [roles, search]);

  const adminRoleListItem: ApiRoleListItem = useMemo(
    () => ({
      id: ADMIN_SYSTEM_ROLE_ID,
      name: ADMIN_LABEL,
      code: ADMIN_ROLE,
      description: t("roles.systemRoleDefault"),
      createdAt: "",
      permissionsCount: TOTAL_PERMISSIONS_COUNT,
    }),
    [t]
  );

  const adminRoleDetail: ApiRoleDetail = useMemo(
    () => ({
      ...adminRoleListItem,
      updatedAt: "",
      permissions: PERMISSION_SECTIONS.reduce(
        (acc, s) => {
          acc[s.id] = s.actions.reduce(
            (a, act) => ({ ...a, [act.id]: true }),
            {} as Record<string, boolean>
          );
          return acc;
        },
        {} as RolePermissionsMap
      ),
    }),
    [adminRoleListItem]
  );

  const rolesToShow = useMemo(
    () => [adminRoleListItem, ...filteredRoles.filter((r) => r.code !== ADMIN_ROLE)],
    [adminRoleListItem, filteredRoles]
  );

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  }, [searchInput]);

  const {
    data: roleDetail,
    isPending: roleDetailPending,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["admin", "roles", selectedRoleId],
    queryFn: () => fetchRoleDetail(selectedRoleId!, t),
    enabled: isAdmin && !!selectedRoleId && selectedRoleId !== ADMIN_SYSTEM_ROLE_ID && !createOpen,
  });

  // isPending = true одразу коли selectedRoleId встановлений, навіть до старту fetch.
  // isLoading (= isPending && isFetching) має 1 рендер gap, що ламає isCreate логіку в sheet.
  const detailLoading = roleDetailPending && !createOpen && !!selectedRoleId && selectedRoleId !== ADMIN_SYSTEM_ROLE_ID;

  const effectiveRoleDetail =
    selectedRoleId === ADMIN_SYSTEM_ROLE_ID ? adminRoleDetail : roleDetail;

  const detailLoadError =
    detailError && detailErrorObj
      ? detailErrorObj instanceof Error
        ? detailErrorObj.message
        : String(detailErrorObj)
      : null;

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createRole>[0]) => createRole(data, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      toast.success(t("toasts.roleCreated"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateRole>[1] }) =>
      updateRole(id, body, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      if (selectedRoleId) {
        queryClient.invalidateQueries({ queryKey: ["admin", "roles", selectedRoleId] });
      }
      toast.success(t("toasts.permissionsSaved"));
    },
  });

  const handleSaveCreate = useCallback(
    async (data: {
      name: string;
      code: string;
      description?: string | null;
      permissions: RolePermissionsMap;
    }) => {
      await createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const handleSaveEdit = useCallback(
    async (
      roleId: string,
      data: { name?: string; description?: string | null; permissions: RolePermissionsMap }
    ) => {
      await updateMutation.mutateAsync({ id: roleId, body: data });
    },
    [updateMutation]
  );

  const openForCreate = () => {
    setSelectedRoleId(null);
    setCreateOpen(true);
    setSheetOpen(true);
  };

  const openForEdit = (role: ApiRoleListItem) => {
    setCreateOpen(false);
    setSelectedRoleId(role.id);
    setSheetOpen(true);
  };

  if (sessionPending) return null;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-muted/50 bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          {t("roles.requireAdmin")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Панель пошуку та дій — як у Користувачів та Обліку авто */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("roles.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("roles.addRole")}
          onClick={openForCreate}
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
        <p className="text-sm text-muted-foreground py-8">{t("roles.loading")}</p>
      ) : (
        <TableWithPagination>
          <RolesTable
            roles={rolesToShow}
            totalCount={roles.length}
            onRowClick={openForEdit}
          />
        </TableWithPagination>
      )}

      <RoleDetailSheet
        role={createOpen ? null : (selectedRoleId === ADMIN_SYSTEM_ROLE_ID ? (effectiveRoleDetail ?? null) : (detailLoading ? null : (roleDetail ?? null)))}
        detailLoading={!createOpen && !!selectedRoleId && selectedRoleId !== ADMIN_SYSTEM_ROLE_ID && detailLoading}
        loadError={!createOpen && selectedRoleId !== ADMIN_SYSTEM_ROLE_ID ? detailLoadError : null}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSheetOpen(false);
            setSelectedRoleId(null);
            setCreateOpen(false);
          }
        }}
        onSaveCreate={handleSaveCreate}
        onSaveEdit={handleSaveEdit}
      />
    </div>
  );
}
