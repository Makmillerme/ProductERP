# Management State Manager & Cache-First (2026-02-23)

## lib/management-state.ts
Persistent state for Управління section via localStorage:
- `dataModelTab`: last tab (statuses|categories|card|data|display)
- `cardCategoryId`: selected category in Картка товару tab

## DataModelPage
- Restore tab from localStorage when URL has no ?tab= param
- On tab change: save to localStorage via setDataModelTab
- useLayoutEffect syncs current tab to storage (including when opened via ?tab= link)
- Mutations in child components do NOT reset tab (nuqs + localStorage)

## TabsConfigManagement (Картка товару)
- Default: first category by order when no saved selection
- Persist: setCardCategoryId on category change
- Restore: getCardCategoryId on mount; useState initializer for immediate display
- useEffect: when categories load, if saved id exists use it; else use first
- staleTime: MANAGEMENT_STALE_MS (5 min) for all queries

## Cache-First (lib/query-keys.ts)
- MANAGEMENT_STALE_MS = 5 * 60 * 1000 (5 min)
- All management queries: statuses, categories, vehicle-types, field-definitions, tabs, tab-detail, mappings, roles, users, display-config
- Reduces refetches; data from cache shown first

## Files changed
- lib/management-state.ts (new)
- lib/query-keys.ts (management key, MANAGEMENT_STALE_MS)
- data-model-page.tsx
- tabs-config-management.tsx
- statuses-management, categories-management, field-definitions-management, data-source-mappings-management, role-display-config-management (staleTime)