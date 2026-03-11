# nextjs_vmd — кеш, персистенція, гідратація

**Query client:** `src/lib/query-client.ts` — gcTime 24 год, staleTime 60 с.

**Providers:** `src/components/layout/providers.tsx` — завжди PersistQueryClientProvider (однакове дерево сервер/клієнт). createSyncStoragePersister з storage: typeof window === "undefined" ? undefined : window.localStorage (на сервері no-op persister). Ключ кешу: vmd-react-query-cache, throttle 1 с, maxAge 24 год.

**Гідратація (vehicles-page):** mounted (useState + useEffect) — до mounted рендер нейтральний: один порожній рядок таблиці, пагінація max=1 value="1", кнопки disabled, pageSize DEFAULT_PAGE_SIZE. Після mounted — реальні дані. showLoadingRow тільки коли !isRestoring && loading && items.length === 0.

**Корекція сторінки:** useEffect з залежностями [total, pageSizeClamped]: totalPagesNew, setPage(p => p > totalPagesNew ? totalPagesNew : p). Не включати page у deps, щоб уникнути зміни розміру масиву.
