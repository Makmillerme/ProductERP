/** Роль з API GET /api/roles */
export type ApiRoleListItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  permissionsCount: number;
};

/** Роль з API GET /api/roles/[id] (з permissions) */
export type ApiRoleDetail = ApiRoleListItem & {
  updatedAt: string;
  permissions: Record<string, Record<string, boolean>>;
};
