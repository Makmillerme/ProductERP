# Phase 1: FieldDefinition.categoryId — виконано

## Prisma
- Додано categoryId String? @map("category_id") до FieldDefinition
- Relation: category Category? @relation(..., onDelete: SetNull)
- Category.fieldDefinitions FieldDefinition[]
- @@index([categoryId])
- db push + generate

## API
- GET /api/admin/field-definitions: query param ?categoryId= — фільтр OR [{ categoryId }, { categoryId: null }]
- POST: body.categoryId, persist
- PATCH [id]: body.categoryId, persist

## field-definitions-management
- listParams включає categoryId — фільтр списку (категорія + глобальні)
- fieldCategoryId state, resetForm, openForEdit
- Sheet: поле «Категорія» з Select (Глобальне | Категорія X)
- create/update: categoryId у payload

## types
- FieldDefinitionItem.categoryId?: string | null

## TabsConfigManagement
- categoryId prop зроблено optional (default "") для vehicles-config

## Файли
- prisma/schema.prisma
- api/admin/field-definitions/route.ts, [id]/route.ts
- field-definitions-management.tsx, types.ts
- tabs-config-management.tsx (optional prop)