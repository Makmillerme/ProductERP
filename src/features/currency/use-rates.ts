"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGoverlaRates } from "./fetch-rates";

const RATES_QUERY_KEY = ["currency", "goverla"] as const;
const STALE_TIME_MS = 5 * 60 * 1000;

export function useGoverlaRates() {
  return useQuery({
    queryKey: RATES_QUERY_KEY,
    queryFn: () => fetchGoverlaRates({ alias: "goverla-ua" }),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
