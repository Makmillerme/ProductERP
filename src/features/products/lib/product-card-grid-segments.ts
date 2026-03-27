import type { ProductConfigTabField } from "../hooks/use-product-config";
import type { GridItem } from "./grid-layout";
import { FULL_ROW_WIDGETS, getGridColSpan } from "./grid-layout";

export type ProductCardSegment =
  | { kind: "empty"; row: number; col: number }
  | {
      kind: "field";
      field: ProductConfigTabField;
      row: number;
      col: number;
      spanClass: string;
    }
  | {
      kind: "stretchGroup";
      row: number;
      fields: ProductConfigTabField[];
      /** Скільки колонок займає група в батьківській сітці 1×3. */
      parentColSpan: number;
    };

function isNarrowField(f: ProductConfigTabField): boolean {
  const wt = f.fieldDefinition.widgetType;
  if (FULL_ROW_WIDGETS.has(wt) || f.colSpan >= 3) return false;
  return true;
}

/**
 * Перетворює плоский список gridItems на сегменти для рендеру картки:
 * послідовні «вузькі» поля з stretchInRow зливаються в одну комірку з внутрішньою сіткою.
 */
export function buildProductCardSegments(
  gridItems: GridItem[],
  fieldById: Map<string, ProductConfigTabField>,
): ProductCardSegment[] {
  const out: ProductCardSegment[] = [];
  let i = 0;
  while (i < gridItems.length) {
    const it = gridItems[i];
    if (it.type === "empty") {
      out.push({ kind: "empty", row: it.row, col: it.col });
      i++;
      continue;
    }

    const f = fieldById.get(it.field.fieldDefinitionId);
    if (!f) {
      i++;
      continue;
    }

    if (isNarrowField(f) && f.stretchInRow) {
      const run: ProductConfigTabField[] = [f];
      let j = i + 1;
      while (j < gridItems.length && gridItems[j]!.type === "field") {
        const itn = gridItems[j]!;
        if (itn.type !== "field") break;
        const fn = fieldById.get(itn.field.fieldDefinitionId);
        if (!fn) break;
        if (!isNarrowField(fn) || !fn.stretchInRow) break;
        if (itn.row !== it.row) break;
        run.push(fn);
        j++;
      }

      if (run.length >= 2) {
        out.push({
          kind: "stretchGroup",
          row: it.row,
          fields: run,
          parentColSpan: run.length,
        });
        i = j;
        continue;
      }
    }

    const span = getGridColSpan(it.field.widgetType, it.field.colSpan, 3);
    const spanClass =
      span >= 3 ? "col-span-full" : span === 2 ? "sm:col-span-2" : "";
    out.push({
      kind: "field",
      field: f,
      row: it.row,
      col: it.col,
      spanClass,
    });
    i++;
  }
  return out;
}

/** Класи внутрішньої сітки для stretchGroup. */
export function stretchGroupInnerGridClass(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-4";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  return "grid grid-cols-1 gap-4 sm:grid-cols-3";
}

export function stretchGroupParentColClass(parentColSpan: number): string {
  if (parentColSpan >= 3) return "col-span-full";
  if (parentColSpan === 2) return "col-span-full sm:col-span-2";
  return "";
}
