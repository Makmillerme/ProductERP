## Прев'ю картки: сітка з «+» при порожньому табі

**Було:** У `DynamicTabs` (`product-detail-sheet.tsx`) `computeGridLayout` викликався лише якщо `dedupedFields.length > 0`. При 0 полях показувався лише текст `productDetail.noFields` — візуальна сітка з кнопками додавання не з'являлась.

**Стало:** Якщо `previewMode && onClickAddField`, сітка рахується й при порожньому списку полів: `computeGridLayout([], 3)` у `grid-layout.ts` додає три `empty`-клітинки в ряд. Умова відображення тексту порожнього стану: `gridItems.length === 0` замість `dedupedFields.length === 0`.
