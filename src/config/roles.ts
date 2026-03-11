/**
 * Системні ролі та допоміжні функції.
 * owner — єдиний на всю систему, має усі права, може призначати/знімати адмінів.
 * admin — єдина захардкоджена роль з усіма правами (крім призначення адмінів); інші ролі з БД.
 */

export { OWNER_ROLE } from "@/config/owner";
export const OWNER_LABEL = "Власник";

/** Єдина захардкоджена роль — адмін (Solution: all права, крім призначення адмінів). */
export const ADMIN_ROLE = "admin" as const;
export const ADMIN_LABEL = "Адмін";

/** ID для відображення системної ролі адміна в UI (немає в БД) */
export const ADMIN_SYSTEM_ROLE_ID = "__admin__" as const;
export type RoleCode = string;

/** Мітки системних ролей (інші — з API) */
export const ROLE_LABELS: Record<string, string> = {
  [ADMIN_ROLE]: ADMIN_LABEL,
  owner: OWNER_LABEL,
};

export function getRoleLabel(code: string | null | undefined, nameFromApi?: string | null): string {
  if (!code) return "—";
  if (code in ROLE_LABELS) return ROLE_LABELS[code];
  return nameFromApi ?? code;
}

/** @deprecated Використовуйте RoleCode або string; залишено для сумісності */
export type Role = string;
