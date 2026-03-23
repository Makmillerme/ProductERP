Admin API: requireAdmin(), dynamic force-dynamic.

/product-types: route.ts GET list, POST; [id] GET, PATCH, DELETE. Model ProductType.
/categories: route.ts GET (_count productTypes, tabs), POST; [id] GET, PATCH, DELETE; [id]/tabs GET, POST.
/statuses: route.ts GET (order asc), POST; [id] GET, PATCH, DELETE. ProductStatus.
/field-definitions: dataType, widgetType, validation, presetValues; route.ts, [id].
/tabs/[id]: GET ?productTypeId=, PATCH fields[].productTypeId.
/display-config: GET ?roleCode=, ?userId=, ?categoryId=; PUT upsert [roleCode, userId, categoryId]. DisplayConfig.
/product-config/category/[categoryId], product-config/[productTypeId], product-config/default: конфіг для фронту.