Optimization display page completed Feb 2025:

1. **allFields** — enabled only when addFieldDialogOpen (tabs-config-management)
2. **productTypes** — enabled when categoryId selected in TabsConfig
3. **ProductDetailSheet conditional render:**
   - products-page: hasOpenedSheetEver — монтує лише після першого відкриття
   - product-card-preview-modal: shouldRender з 300ms delayed unmount для анімації закриття
4. **handleRequestCreateField** — обгорнуто в useCallback (display-page)
5. **Loading indicator** — в діалозі Add Field при allFieldsLoading (Loader2 spinner)
6. **Prefetch on hover** — скасовано (опційно)