# Field Many-to-Many: UI та логіка доступності (завершено)

## Дата
2025-02-23

## Що зроблено

### 1. field-definitions-management.tsx
- **handleSave**: передає `categoryIds` і `productTypeIds` замість `categoryId` у create/update API.
- **Sheet**: Select «Категорія» замінено на блок чекбоксів:
  - Категорії: чекбокси для кожної категорії (порожні = глобальне).
  - Типи товару: чекбокси згруповані по обраних категоріях (порожні = для всіх типів обраних категорій).
- При знятті категорії — автоматично знімаються її типи з `fieldProductTypeIds`.
- Додано `fetchVehicleTypes` і `vehicleTypesByCategory` для відображення типів.

### 2. data-model-page.tsx
- Dropdown типів товару справа від категорії показується лише коли `typesForSelectedCategory.length > 0`.
- Якщо в категорії немає типів — тільки dropdown категорії.

### 3. field-utils.ts
- Нова функція `isFieldAvailableForCategory(field, categoryId, productTypeId?, vehicleTypes?)`:
  - Глобальне: `categoryIds.length === 0 && productTypeIds.length === 0` → true.
  - Категорія в scope: `categoryIds` порожні або включає `categoryId`.
  - Типи: `productTypeIds` порожні або (при наявності `productTypeId`) включає його; інакше перевіряє перетин з типами категорії через `vehicleTypes`.

### 4. tabs-config-management.tsx
- `groupedUnassignedFields` використовує `isFieldAvailableForCategory` замість `f.categoryId === selectedCategoryId`.
- `global`: поля без `categoryIds` і `productTypeIds`.
- `currentCat`: поля з обмеженнями, доступні для поточної категорії.
- `otherCats`: поля з обмеженнями, недоступні для поточної категорії.
- Відображення «Інші категорії» — через `f.categoryIds` (список назв категорій).

## Логіка доступності (many-to-many)

| categoryIds | productTypeIds | Результат |
|-------------|----------------|-----------|
| [] | [] | Глобальне — для всіх |
| [A,B] | [] | Для категорій A, B (усі типи) |
| [] | [T1,T2] | Для типів T1, T2 (будь-яка категорія) |
| [A] | [T1] | Для категорії A + тип T1 |

## Файли змінено
- `field-definitions-management.tsx`
- `field-utils.ts`
- `tabs-config-management.tsx`
- `field-many-to-many-and-product-type.md` (план оновлено)
