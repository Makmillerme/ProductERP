/**
 * Власник системи — єдиний користувач з роллю "owner" у полі user.role.
 * Без окремої таблиці. Роль зберігається безпосередньо в таблиці user (БД).
 * Передача прав — через UPDATE user SET role (маршрут /api/admin/owner/transfer).
 */

/** Код ролі власника — зберігається в user.role */
export const OWNER_ROLE = "owner" as const;

/**
 * Синхронна перевірка: чи є вказана роль роллю власника.
 * Роль вже є в сесії (session.user.role) — зайвих DB-запитів не потрібно.
 */
export function isOwnerRole(role: string | null | undefined): boolean {
  return role === OWNER_ROLE;
}
