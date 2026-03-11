/** Користувач з відповіді Better-Auth admin listUsers */
export type AdminUser = {
  id: string;
  name: string;
  /** Прізвище (якщо зберігається окремо на бекенді) */
  lastName?: string | null;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
};

export type ListUsersParams = {
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  limit: number;
  offset: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type ListUsersResult = {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
};

export type AdminSession = {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};
