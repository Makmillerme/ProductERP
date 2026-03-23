# i18n Phase 1: Toast + Validation — завершено

**Дата:** 2025-02-23

## Зміни

### Локалі (uk.json, en.json)

- **toasts:** categoryCreated/Saved/Deleted, productTypeCreated/Saved/Deleted, fieldCreated/Saved/Deleted, statusCreated/Saved/Deleted, tabCreated/Saved/Deleted, roleCreated, permissionsSaved, userBanned/Unbanned/Deleted, ownerTransferred, fileDeleted, changesSaved
- **validationRequired:** categoryName, productTypeName, fieldName, statusName, tabName, roleNameAndCode
- **errors:** saveFailed, deleteFailed, createFailed

### Компоненти (useLocale + t())

- categories-management
- product-types-management
- field-definitions-management
- statuses-management
- tabs-config-management
- roles-management, role-detail-sheet
- users-management, user-detail-sheet
- product-documents-tab
- products-page (ProductsTableView)

### Заміни

- toast.success("...") → toast.success(t("toasts.xxx"))
- toast.error("Вкажіть...") → toast.error(t("validationRequired.xxx"))
- toast.error(e.message ?? "Помилка...") → toast.error(e.message ?? t("errors.xxx"))
