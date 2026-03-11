# Аудит поля «Файли» (file_upload) — лютий 2025

## Потік даних

1. **Конфігурація:** field-definitions-management → presetValues (JSON) → DocumentFoldersEditor
2. **Папки:** presetValues.folders = [{ code, label, maxFiles? }]
3. **Джерело:** getDocumentFoldersForField — спочатку presetValues, fallback tabConfig
4. **Відображення:** VehicleDocumentsTab (folders) → FolderSection → AddTile, DocThumbnail
5. **API:** GET/POST /api/products/[id]/documents, DELETE /api/products/[id]/documents/[docId]

## Виправлено

- **Повідомлення:** "Налаштуйте папки у конфігурації табу" → "у визначенні поля «Файли» (Модель даних → Поля)"
- **vehicle-documents.ts:** оновлено коментар про джерело папок
- **validate-preset-values:** перевірка унікальності code, покращена валідація label

## Виявлено (не критично)

1. **maxFiles** — зберігається, але не застосовується (ні в UI, ні в API)
2. **maxFileSizeBytes** — налаштовується в field validation, але API використовує хардкод 100 МБ
3. **tabConfig** — fallback для папок, але tabs-config-management не має UI для редагування tabConfig

## Файли
- document-folders-editor.tsx, vehicle-documents-tab.tsx, vehicle-detail-sheet.tsx
- dynamic-field-renderer.tsx, documents/route.ts, [docId]/route.ts
- product-document-upload.ts, validate-preset-values.ts