# Management Navigation Restructure

## Changes
Управління sidebar item now uses Collapsible with sub-menu:
- /management -> redirects to /management/data-model
- /management/data-model -> Модель даних (tabs: Статуси, Картка авто, Дані, Відображення)
- /management/users -> Користувачі (tabs: Користувачі, Ролі)

## Key Files
- config/navigation.ts: NavItem type now supports `items?: NavSubItem[]`
- components/layout/app-sidebar.tsx: Uses Collapsible + SidebarMenuSub for items with sub-items
- components/layout/app-header.tsx: Breadcrumbs updated to flatMap sub-items
- app/(app)/management/page.tsx: Redirects to /management/data-model
- app/(app)/management/data-model/page.tsx: DataModelPage component
- app/(app)/management/users/page.tsx: UsersPage component
- features/management/components/data-model-page.tsx: Tabs for CMS config
- features/management/components/users-page.tsx: Users + Roles tabs
- features/management/components/management-page.tsx: OLD, no longer imported (dead code)

## Tab mapping
Статуси -> VehicleTypesManagement
Картка авто -> TabsConfigManagement
Дані -> FieldDefinitionsManagement
Відображення -> RoleDisplayConfigManagement