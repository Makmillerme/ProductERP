## Implemented (2026-03)
- **Docs:** `docs/data-fetching-modernization.md` — dev Postgres order, ECONNREFUSED, checklist, queue note, debounce note.
- **Keys:** `productConfigQueryKeys` + `defaultType` in `use-product-config.ts`; exported `listConfigQueryKeys` from `use-list-config.ts`; `MANAGEMENT_STALE_MS` for list-config query.
- **invalidateCategoryDisplayCaches** in `src/lib/invalidate-display-caches.ts` — list-config + product-config per category types only.
- **Tabs:** `tabs-config-management` — optimistic create (temp id → server merge), update (list meta), delete (remove + removeQueries detail + close sheet); `bustDisplayCaches` narrow invalidation; `adminDeleteAllowMissing` for idempotent DELETE (404 ok).
- **Admin client:** `adminDeleteAllowMissing`.
- **Auth:** `auth-client` `sessionOptions.refetchOnWindowFocus: false`.
- **Field defs:** invalidate uses `productConfigQueryKeys.all` / `listConfigQueryKeys.all`.
- **Display settings / preview modal / product-detail-sheet:** use shared query key helpers where applicable.
- **Debounce:** `src/lib/debounce.ts` for future autosave.
