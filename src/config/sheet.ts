/**
 * Уніфіковані стилі для Sheet у всьому проекті.
 */
/** Контейнер sheet: без горизонтального скролу */
export const SHEET_CONTENT_CLASS =
  "flex min-w-0 w-full max-w-[min(100vw-2rem,28rem)] flex-col overflow-x-hidden sm:max-w-md md:max-w-lg lg:max-w-xl";

/** Додаткові стилі для input/select/textarea у формах sheet (hover вже в base UI) */
export const SHEET_INPUT_CLASS = "";

/** Header: повернуто до оригіналу */
export const SHEET_HEADER_CLASS =
  "flex h-14 shrink-0 flex-row items-center gap-2 px-4 py-0 pr-12 md:px-6";

/** Body: scrollable area, без горизонтального скролу */
export const SHEET_BODY_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 md:px-6";

/** Scrollable content inside body: тільки вертикальний скрол */
export const SHEET_BODY_SCROLL_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto py-2";

/** Footer */
export const SHEET_FOOTER_CLASS =
  "shrink-0 flex flex-col gap-2 border-t border-border px-4 pt-4 pb-4 md:px-6";

/** Gap між секціями форми */
export const SHEET_FORM_GAP = "gap-3";

/** Горизонтальний padding форми: щоб focus ring (3px) не обрізався overflow-x-hidden */
export const SHEET_FORM_PADDING = "px-1";

/** Gap між label та input у полі */
export const SHEET_FIELD_GAP = "gap-2";

/** Відступи між табами в sheet */
export const SHEET_TABS_GAP = "gap-3";

/** Відступ зверху TabsContent від TabsList */
export const SHEET_TABS_CONTENT_MT = "mt-3";

/** Скрол у sheet: тільки вертикальний, без горизонтального */
export const SHEET_SCROLL_CLASS =
  "overflow-x-hidden overflow-y-auto";

/** Картка товару: відступ між полями в сітці (mobile + desktop) */
export const PRODUCT_CARD_GRID_GAP = "gap-4";
