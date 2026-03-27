## Bug: збереження табу без завантажених полів зтирало TabField

**Причина:** У `tabs-config-management.tsx` після `openForEdit` `assignedFields` були `[]` до приходу `tabDetail`. Кнопка «Зберегти» лишалась активною. `handleSave` робив PATCH з `fields: []` → API `deleteMany` по табу без `createMany` → усі призначення полів зникали з БД. Картка/прев'ю показували порожній таб (лише визначення полів у «Модель даних»).

**Виправлення:**
- `tabEditDetailReady`: для режиму редагування — є `tabDetail`, `tabDetail.id === editingTabId`, не `tabDetailLoading`.
- Заблоковано Save: `disabled={saving || (!isCreate && !tabEditDetailReady)}`; у `handleSave` guard + toast `productsConfig.tabsConfig.tabDetailNotReady` (en/uk + generate:locales).
- `useEffect` синхронізації `assignedFields`: перевірка `tabDetail.id === editingTabId`, поля з `tabDetail.fields ?? []`.
- PATCH body зберігає `productTypeId`, `colSpan`, `isRequired`, `sectionTitle` з `assignedFields` (раніше скидалися в 1/false/null).

**Прев'ю:** `product-card-preview-modal.tsx` — `resolvedProductTypeIdForConfig` для `useProductConfig`, мутацій і `ProductDetailSheet`; узгоджено з вибором типу в прев'ю.

**Відновлення даних:** Якщо поля вже зітерті — знову додати їх на таб «Відображення» з розділу призначених полів (або через прев'ю «+»).
