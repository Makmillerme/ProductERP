# План оптимізації сторінки Відображення (Display)

## Поточний стан (аналіз через Serena)

### DisplayPage
- **Запити:** 1× `useQuery` (categories)
- **Дочірні:** TabsConfigManagement, ProductCardPreviewModal — завжди в DOM при табі "Картка товару"
- **Стан:** Сторінка вже dynamic import з `loading: ContentSkeleton`

### TabsConfigManagement
| Запит | enabled | Проблема |
|------|---------|----------|
| categories | — | Дубль з DisplayPage (спільний кеш) |
| productTypes | — | **Завантажується завжди**, навіть коли categoryId порожній |
| tabs | `!!selectedCategoryId` | OK |
| tabDetail | `!!editingTabId && !isCreate` | OK |
| allFields | — | **pageSize=500** — завантажує ВСІ поля одразу при монтуванні |

### ProductCardPreviewModal
| Запит | enabled | Примітка |
|------|---------|----------|
| useListConfig | `!!categoryId` | OK |
| productTypes | `open && !!categoryId` | OK |
| useProducts | `open && !!categoryId && table` | OK |

---

## Пріоритетні оптимізації

### 1. allFields — lazy load (високий пріоритет)
**Проблема:** 500 полів завантажуються при кожному відкритті сторінки Відображення.

**Рішення:** `enabled: addFieldDialogOpen` — завантажувати поля лише при відкритті діалогу «Додати поле до табу».

**Ризик:** Перше відкриття діалогу буде з затримкою. Можна додати `placeholderData` або prefetch при hover на кнопку «+».

---

### 2. productTypes в TabsConfigManagement — умовний enabled (середній)
**Проблема:** productTypes завантажується навіть коли categoryId порожній (екран «Оберіть категорію»).

**Рішення:** `enabled: !!selectedCategoryId` — завантажувати типи лише після вибору категорії.

**Примітка:** ProductCardPreviewModal теж використовує productTypes з тим самим ключем — кеш спільний. Якщо modal відкриється до вибору категорії, він має `enabled: open && categoryId`, тож не конфліктує.

---

### 3. ProductCardPreviewModal — умовний рендер ProductDetailSheet (низький)
**Проблема:** ProductDetailSheet монтується завжди (open={previewOpen}). Коли closed, Sheet не рендерить контент, але компонент у дереві.

**Рішення:** Рендерити ProductDetailSheet лише коли `open === true`:
```tsx
{open && viewMethod === "table" && (
  <ProductDetailSheet ... />
)}
```
Для kanban — Dialog вже умовний (if viewMethod !== "table").

---

### 4. TabsConfigManagement — відкладені дочірні при порожній категорії (низький)
**Проблема:** При categoryId="" показується «Оберіть категорію», але categories, productTypes, allFields вже виконують запити.

**Рішення:** Ранній return з мінімальним UI — без виклику хуків, що залежать від даних. Складніше через правила хуків. Альтернатива: винести таблицю табів у окремий компонент, який монтується лише при `!!categoryId`.

---

### 5. Мемоізація (низький)
- `React.memo(TabsConfigManagement)` — якщо `onRequestCreateField` та `openAddTabRef` стабільні.
- `handleRequestCreateField` — обгорнути в `useCallback` (зараз створює нову функцію при кожному рендері через `window.location.href`).

---

### 6. Prefetch (опційно)
- При hover на кнопку «Додати поле» — prefetch allFields.
- При hover на Eye (превʼю) — prefetch product-config для категорії.

---

## Порядок впровадження

1. **allFields enabled: addFieldDialogOpen** — найбільший ефект
2. **productTypes enabled: !!selectedCategoryId**
3. **ProductDetailSheet умовний рендер**
4. **useCallback для handleRequestCreateField**
5. **Prefetch при hover** (якщо потрібно)

---

## Очікуваний ефект

- **До:** 4–5 паралельних API-запитів при відкритті сторінки (categories, productTypes, allFields 500, tabs при categoryId, listConfig при preview).
- **Після:** 2–3 запити (categories, tabs при categoryId; allFields — лише при відкритті діалогу; productTypes — лише при виборі категорії).
