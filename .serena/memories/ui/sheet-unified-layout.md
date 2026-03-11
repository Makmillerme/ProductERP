# Уніфікований layout для Sheet (2025-02-23)

## config/sheet.ts
- SHEET_INPUT_CLASS — порожній (hover в base Input/Textarea/Select)
- SHEET_HEADER_CLASS — h-14, px-4 py-0 pr-12 md:px-6 (повернуто до оригіналу)
- SHEET_BODY_CLASS — px-4 md:px-6
- SHEET_BODY_SCROLL_CLASS — gap-4, py-2
- SHEET_FOOTER_CLASS — pt-4 pb-4, border-t, px-4 md:px-6
- SHEET_FORM_GAP — gap-3
- SHEET_FIELD_GAP — gap-2
- SHEET_TABS_GAP — gap-3
- SHEET_TABS_CONTENT_MT — mt-3

## Base UI (Input, Textarea, SelectTrigger)
- hover:border-muted-foreground/60 на рамках інпутів
- transition-[color,box-shadow,border-color]

## components/sheet-form-layout.tsx
- SheetFormLayout — wrapper: Header + Body + Footer
- Використовує константи з config/sheet

## Оновлені sheets
- field-definitions-management, statuses-management, vehicle-types-management
- categories-management (2 sheets, уніфіковано SHEET_FIELD_GAP)
- tabs-config-management
- vehicle-detail-sheet, user-detail-sheet, role-detail-sheet
- composite-subfields-editor