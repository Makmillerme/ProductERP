# Галерея та Файли — зміни UI (лютий 2025)

## 1. defaultValue видалено для media_gallery та file_upload

- Додано media_gallery і file_upload до WIDGETS_WITHOUT_DEFAULT_VALUE (field-constructor.ts)
- Поле "Значення за замовчуванням" більше не показується для Галереї та Файлів — для цих віджетів воно не має сенсу

## 2. Макс. розмір файлу — новий UI (Галерея та Файли)

**Було:** одне поле "Макс. розмір файлу (байт)" з підказкою "5242880 для 5 МБ"

**Стало:**
- Поле вводу числа + спадний список одиниць (байт, КБ, МБ)
- За замовчуванням: КБ
- Лейбл: "Макс. розмір файлу" (без "(байт)")

**field-constructor.ts:**
- FILE_SIZE_UNITS: bytes (1), KB (1024), MB (1024*1024)
- bytesToFileSizeDisplay(bytes): конвертує байти в найкращу одиницю для відображення
- fileSizeDisplayToBytes(value, unit): конвертує в байти
- inputType "fileSize" для media та file validation
- buildValidationJson: фільтрує maxFileSizeBytes=0 (не зберігає)

**field-definitions-management.tsx:**
- renderOpt для inputType "fileSize": Input (number) + Select (одиниці)
- При зміні значення або одиниці — перерахунок байтів і оновлення validationValues.maxFileSizeBytes

## Файли
- src/config/field-constructor.ts
- src/features/management/components/vehicles-config/field-definitions-management.tsx