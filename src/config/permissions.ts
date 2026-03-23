/**
 * Секції та дії для редактора прав ролей.
 * Використовується в RoleDetailSheet та (майбутньо) для перевірки доступу в API/UI.
 */
export const PERMISSION_SECTIONS = [
  {
    id: "users",
    label: "Користувачі",
    actions: [
      { id: "view", label: "Перегляд" },
      { id: "create", label: "Створення" },
      { id: "edit", label: "Редагування" },
      { id: "delete", label: "Видалення" },
      { id: "ban", label: "Блокування" },
      { id: "unban", label: "Розблокування" },
      { id: "sessions", label: "Перегляд та відкликання сесій" },
    ],
  },
  {
    id: "roles",
    label: "Ролі",
    actions: [
      { id: "view", label: "Перегляд" },
      { id: "edit", label: "Редагування прав" },
    ],
  },
  {
    id: "products",
    label: "Облік товарів",
    actions: [
      { id: "view", label: "Перегляд" },
      { id: "create", label: "Створення" },
      { id: "edit", label: "Редагування" },
      { id: "delete", label: "Видалення" },
      { id: "media_upload", label: "Завантаження медіа" },
      { id: "media_delete", label: "Видалення медіа" },
    ],
  },
  {
    id: "products_config",
    label: "Налаштування обліку товарів",
    actions: [
      { id: "view", label: "Перегляд конфігурації" },
      { id: "edit", label: "Редагування конфігурації" },
    ],
  },
  {
    id: "upload",
    label: "Завантажувач",
    actions: [{ id: "run", label: "Запуск завантаження" }],
  },
  {
    id: "management",
    label: "Сторінка управління",
    actions: [{ id: "view", label: "Перегляд" }],
  },
  {
    id: "settings",
    label: "Налаштування",
    actions: [
      { id: "view", label: "Перегляд" },
      { id: "edit", label: "Редагування профілю" },
    ],
  },
  {
    id: "dashboard",
    label: "Головна / Дашборд",
    actions: [{ id: "view", label: "Перегляд" }],
  },
] as const;

export type PermissionSectionId = (typeof PERMISSION_SECTIONS)[number]["id"];
export type PermissionActionId = (typeof PERMISSION_SECTIONS)[number]["actions"][number]["id"];

/** Загальна кількість дій (прав) у системі — для відображення «усі» для адміна */
export const TOTAL_PERMISSIONS_COUNT = PERMISSION_SECTIONS.reduce(
  (acc, s) => acc + s.actions.length,
  0
);

/** Ключ права: section.action */
export type PermissionKey = `${PermissionSectionId}.${string}`;

/** Набір прав для ролі: section -> action -> boolean */
export type RolePermissionsMap = Partial<
  Record<PermissionSectionId, Record<string, boolean>>
>;
