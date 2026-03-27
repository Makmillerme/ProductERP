/**
 * Розрахунок позицій полів у 3-колоночній сітці.
 * Повертає масив елементів: поле або порожня клітинка (placeholder для "+").
 */

export type GridField = {
  fieldDefinitionId: string;
  colSpan: number;
  order: number;
  label: string;
  code: string | null;
  widgetType: string;
  /** При додаванні: цільова позиція (ряд, колонка) для розміщення. */
  targetRow?: number;
  targetCol?: number;
  [key: string]: unknown;
};

export type GridItem =
  | { type: "field"; field: GridField; row: number; col: number }
  | { type: "empty"; row: number; col: number };

export const FULL_ROW_WIDGETS = new Set([
  "textarea",
  "media_gallery",
  "file_upload",
  "composite",
  "radio",
  "multiselect",
]);

const FULL_WIDTH_WIDGETS = FULL_ROW_WIDGETS;

function rowMajorBefore(
  a: { row: number; col: number },
  b: { row: number; col: number }
): boolean {
  return a.row < b.row || (a.row === b.row && a.col < b.col);
}

/** Курсор після розміщення поля шириною span колонок. */
function advanceCursor(
  row: number,
  col: number,
  span: number,
  cols: number
): [number, number] {
  let c = col + span;
  let r = row;
  while (c >= cols) {
    r++;
    c -= cols;
  }
  return [r, c];
}

/**
 * Сітка без «стрибка» курсора назад (як було при row=targetR,col=targetC після while —
 * full-row накладався на попередні поля та забирав «+»).
 * Якщо ціль з order попереду поточного курсора — доповнюємо «+» до цілі.
 * Якщо ціль позаду — ставимо в поточну комірку; full-row доповнює ряд «+» і переноситься вниз.
 */
export function computeGridLayout(
  fields: GridField[],
  cols = 3
): GridItem[] {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const items: GridItem[] = [];
  let row = 0;
  let col = 0;

  for (const field of sorted) {
    const isFullWidth =
      FULL_WIDTH_WIDGETS.has(field.widgetType) || field.colSpan >= cols;
    const span = isFullWidth ? cols : Math.min(field.colSpan, cols);

    let targetR: number;
    let targetC: number;
    if (field.targetRow != null && field.targetCol != null) {
      targetR = field.targetRow;
      targetC = field.targetCol;
    } else {
      targetR = Math.floor(field.order / cols);
      targetC = isFullWidth ? 0 : field.order % cols;
    }

    let tr = targetR;
    let tc = targetC;
    if (rowMajorBefore({ row: tr, col: tc }, { row, col })) {
      tr = row;
      tc = col;
    }

    while (row < tr || (row === tr && col < tc)) {
      items.push({ type: "empty", row, col });
      col++;
      if (col >= cols) {
        row++;
        col = 0;
      }
    }

    if (isFullWidth && col > 0) {
      while (col < cols) {
        items.push({ type: "empty", row, col });
        col++;
      }
      row++;
      col = 0;
    }

    if (!isFullWidth && col + span > cols) {
      while (col < cols) {
        items.push({ type: "empty", row, col });
        col++;
      }
      row++;
      col = 0;
    }

    items.push({ type: "field", field, row, col });
    [row, col] = advanceCursor(row, col, span, cols);
  }

  while (col > 0 && col < cols) {
    items.push({ type: "empty", row, col });
    col++;
  }
  if (col >= cols) {
    row++;
    col = 0;
  }

  for (let c = 0; c < cols; c++) {
    items.push({ type: "empty", row, col: c });
  }

  return items;
}

export function getGridColSpan(
  widgetType: string,
  colSpan: number,
  cols = 3
): number {
  if (FULL_WIDTH_WIDGETS.has(widgetType) || colSpan >= cols) return cols;
  return Math.min(colSpan, cols);
}
