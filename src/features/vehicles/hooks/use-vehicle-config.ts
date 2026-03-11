"use client";

import { useQuery } from "@tanstack/react-query";

export type VehicleConfigTab = {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  icon: string | null;
  tabConfig: string | null;
  order: number;
  fields: VehicleConfigTabField[];
};

export type VehicleConfigTabField = {
  id: string;
  tabDefinitionId: string;
  fieldDefinitionId: string;
  vehicleTypeId: string | null;
  order: number;
  colSpan: number;
  isRequired: boolean;
  sectionTitle: string | null;
  fieldDefinition: {
    id: string;
    code: string;
    label: string;
    dataType: string;
    widgetType: string;
    isSystem: boolean;
    systemColumn: string | null;
    presetValues: string | null;
    validation: string | null;
    unit: string | null;
    defaultValue: string | null;
    placeholder: string | null;
    hiddenOnCard?: boolean;
  };
};

export type VehicleConfigResponse = {
  vehicleType: { id: string; name: string; code: string };
  category: { id: string; name: string; code: string } | null;
  tabs: VehicleConfigTab[];
  roleConfig: {
    visibleTabIds?: string[];
    visibleFieldIds?: string[];
    filterableFieldIds?: string[];
    searchableFieldIds?: string[];
    sortableFieldIds?: string[];
    tableColumnIds?: string[];
    defaultPageSize?: number;
  } | null;
};

const vehicleConfigKeys = {
  all: ["vehicle-config"] as const,
  type: (vehicleTypeId: string) =>
    [...vehicleConfigKeys.all, vehicleTypeId] as const,
};

async function fetchVehicleConfig(
  vehicleTypeId: string,
): Promise<VehicleConfigResponse> {
  const res = await fetch(`/api/vehicle-config/${vehicleTypeId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Failed to load config",
    );
  }
  return res.json();
}

export function useVehicleConfig(vehicleTypeId: string | null) {
  return useQuery({
    queryKey: vehicleConfigKeys.type(vehicleTypeId ?? ""),
    queryFn: () => fetchVehicleConfig(vehicleTypeId!),
    enabled: !!vehicleTypeId,
    staleTime: 5 * 60 * 1000,
  });
}
