# Опція "Приховано на картці товару" (hiddenOnCard)

## Призначення
Поля **Числовий рядок** (number_input) та **Формула** (calculated) можуть бути позначені як приховані на картці товару. Дані зберігаються для розрахунків, але не відображаються в UI картки.

## Реалізація

### Prisma
- `FieldDefinition.hiddenOnCard` (Boolean, default: false)

### API
- POST/PATCH `/api/admin/field-definitions`: приймає та зберігає `hiddenOnCard`

### UI
- **field-definitions-management.tsx**: чекбокс Shadcn "Приховано на картці товару" для number_input та calculated (після блоку defaultValue)
- **dynamic-field-renderer.tsx**: якщо `hiddenOnCard === true` для number_input або calculated — повертає `null` (поле не рендериться)

### Типи
- `FieldDefinitionItem.hiddenOnCard?: boolean`
- `VehicleConfigTabField.fieldDefinition.hiddenOnCard?: boolean`

## Файли
- `prisma/schema.prisma`
- `src/app/api/admin/field-definitions/route.ts`, `[id]/route.ts`
- `src/features/management/components/vehicles-config/field-definitions-management.tsx`
- `src/features/management/components/vehicles-config/types.ts`
- `src/features/vehicles/hooks/use-vehicle-config.ts`
- `src/features/vehicles/components/dynamic-field-renderer.tsx`