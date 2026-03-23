# Phase 0: Спільний dropdown категорії — виконано

## Зміни

### data-model-page.tsx
- Додано useQuery для categories
- Додано state selectedCategoryId, синхронізація з getCardCategoryId/setCardCategoryId
- useEffect для ініціалізації з storage або першої категорії
- Dropdown категорії показується для табів «Поля та дані» (data) і «Картка товару» (card)
- Передає categoryId у TabsConfigManagement і FieldDefinitionsManagement

### tabs-config-management.tsx
- Прибрано getCardCategoryId, setCardCategoryId
- Прибрано внутрішній state selectedCategoryId та useEffect ініціалізації
- Приймає categoryId як prop
- Прибрано dropdown категорії з JSX
- Залишено кнопку «Додати таб»

### field-definitions-management.tsx
- Додано prop categoryId (optional)
- Phase 1 використає для фільтрації

## Результат

Один dropdown на рівні data-model-page. При перемиканні між «Поля та дані» і «Картка товару» обрана категорія зберігається (localStorage).