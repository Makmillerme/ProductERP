Розкат оптимізацій Management (березень 2025):

1. display-settings-management: після save — setQueryData для ключа listConfig + display + categoryId; прибрано invalidate listConfigQueryKeys.all; list-config категорії invalidate.

2. statuses-management: adminDeleteAllowMissing для DELETE; PUBLIC_STATUSES_KEY ["statuses"] інвалідиться з admin; optimistic update/delete для admin-списку; create лише invalidate.

3. product-card-preview-modal: onSettled інвалідує ["admin","tab-detail", vars.tabId] замість префікса на всі таби.

4. field-definitions-management: adminDeleteAllowMissing; applyFieldScopeToDisplayCaches (invalidateCategoryDisplayCaches + category-tabs) з fallback на глобальні ключі; optimistic для FIELD_DEFS list + update/delete; mutate delete з {id, categoryIds, productTypeIds}; update з prevCategoryIds/prevProductTypeIds.

5. categories-management: optimistic CRUD для CATEGORIES_KEY + PRODUCT_TYPES_KEY; adminDeleteAllowMissing; публічний ["categories"] invalidate; лічильники _count при VT create/delete.

6. product-types-management: optimistic + adminDeleteAllowMissing; invalidate CATEGORIES_KEY при delete типу з categoryId.

7. users-management: invalidateUsersList via USERS_QUERY_KEY замість refetch; user-detail-sheet: invalidate ["me"] після збереження профілю поточного користувача та після revoke all sessions якщо target === currentUserId.

8. roles-management: updateMutation інвалідує ["admin","roles", variables.id] замість selectedRoleId closure.