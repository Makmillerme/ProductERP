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

    const useTarget =
      field.targetRow != null && field.targetCol != null;
    const useOrderAsPosition = !useTarget;
    const targetR = useTarget
      ? field.targetRow!
      : Math.floor(field.order / cols);
    const targetC = useTarget
      ? field.targetCol!
      : isFullWidth
        ? 0
        : field.order % cols;

    if (useTarget || useOrderAsPosition) {
      while (row < targetR || (row === targetR && col < targetC)) {
        items.push({ type: "empty", row, col });
        col++;
        if (col >= cols) {
          row++;
          col = 0;
        }
      }
      row = targetR;
      col = targetC;
    } else if (col + span > cols) {
      while (col < cols) {
        items.push({ type: "empty", row, col });
        col++;
      }
      row++;
      col = 0;
    } else if (isFullWidth && col > 0) {
      while (col < cols) {
        items.push({ type: "empty", row, col });
        col++;
      }
      row++;
      col = 0;
    }

    items.push({ type: "field", field, row, col });
    col += span;

    if (col >= cols) {
      row++;
      col = 0;
    }
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
