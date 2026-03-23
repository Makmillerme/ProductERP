"use client";

import { useQuery } from "@tanstack/react-query";

export type ProductStatusItem = {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
};

export type StatusOption = { value: string; label: string };

async function fetchStatuses(): Promise<ProductStatusItem[]> {
  const res = await fetch("/api/statuses");
  if (!res.ok) throw new Error("Failed to fetch statuses");
  const data = await res.json();
  const list = data?.statuses ?? data;
  if (!Array.isArray(list)) return [];
  return list;
}

export function useStatuses() {
  const q = useQuery({
    queryKey: ["statuses"],
    queryFn: fetchStatuses,
  });
  const statuses = q.data ?? [];
  const options: StatusOption[] = statuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  return {
    statuses,
    options,
    isLoading: q.isLoading,
    error: q.error,
  };
}
