/**
 * Узгоджені таблиці в management (products-config, users, roles).
 *
 * - Розклад: `table-layout: fixed` + `colgroup` (% сума = 100) + `minWidth` на `<col>` — при вузькому
 *   в’юпорті таблиця може стати ширшою за контейнер; горизонтальний скрол лише тоді, коли потрібно
 *   (`overflow-x-auto` на обгортці в `@/components/ui/table`).
 * - Клітинки з текстом: `mgmtTableCell*` + внутрішній `<TableCellText>` — `truncate` у межах колонки.
 */

/** Сума елементів === 100 */
export const MGMT_COLGROUP_5_STATUS = [8, 34, 10, 20, 28] as const;
export const MGMT_COLGROUP_5_PRODUCT_TYPES = [28, 24, 10, 12, 26] as const;
export const MGMT_COLGROUP_5_FIELD_DEFS = [26, 18, 16, 22, 18] as const;
export const MGMT_COLGROUP_5_ROLES = [22, 18, 28, 18, 14] as const;
export const MGMT_COLGROUP_4_TABS = [10, 38, 22, 30] as const;
export const MGMT_COLGROUP_6_USERS = [24, 14, 14, 14, 14, 20] as const;

export const mgmtTableHeaderRowClass = "bg-muted/50 hover:bg-muted/50";

/** Заголовок колонки */
export const mgmtTableHeadClass =
  "h-11 px-3 align-middle text-left text-sm font-medium text-foreground";
export const mgmtTableHeadCenterClass =
  "h-11 px-3 align-middle text-center text-sm font-medium text-foreground";

/**
 * Тіло таблиці. `max-w-0` разом із `table-fixed` дає коректне truncate для вкладеного тексту.
 */
export const mgmtTableCellClass = "h-11 px-3 align-middle text-sm max-w-0";
export const mgmtTableCellPrimaryClass = `${mgmtTableCellClass} font-medium`;
export const mgmtTableCellMutedClass = `${mgmtTableCellClass} text-muted-foreground`;
export const mgmtTableCellMutedSmClass = `${mgmtTableCellMutedClass} text-sm`;
export const mgmtTableCellMutedXsClass = `${mgmtTableCellMutedClass} text-xs`;
export const mgmtTableCellNumericClass = `${mgmtTableCellClass} tabular-nums text-muted-foreground`;

export type MgmtColPercents = readonly number[];

/** Мін. ширина колонки в `<col>` — забезпечує переповнення при багатьох колонках / вузькому екрані. */
export const MGMT_TABLE_COL_MIN_WIDTH = "8rem";

/**
 * Таблиці management: не `w-full` окремо — використовується патерн `min-w-full w-max` з ui/table
 * для коректного скролу без зайвого скролу, коли все поміщається.
 */
export const mgmtTableLayoutClass =
  "table-fixed min-w-full w-max max-w-none";
