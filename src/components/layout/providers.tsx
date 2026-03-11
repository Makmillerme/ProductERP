"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, useMemo, type ReactNode } from "react";
import { getQueryClient } from "@/lib/query-client";
import { LocaleProvider } from "@/lib/locale-provider";

const PERSIST_KEY = "vmd-react-query-cache";
const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000; // 24 год

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: typeof window === "undefined" ? undefined : window.localStorage,
        key: PERSIST_KEY,
        throttleTime: 1000,
      }),
    []
  );

  const content = (
    <LocaleProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </LocaleProvider>
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
      }}
    >
      {content}
    </PersistQueryClientProvider>
  );
}
