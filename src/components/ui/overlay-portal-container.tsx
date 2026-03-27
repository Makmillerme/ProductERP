"use client";

import * as React from "react";

const OverlayPortalContainerContext = React.createContext<HTMLElement | null>(null);

/** Контейнер для Radix Portal (Select, Dropdown тощо) всередині Sheet/Dialog із transform. */
export function useOverlayPortalContainer(): HTMLElement | null {
  return React.useContext(OverlayPortalContainerContext);
}

export function OverlayPortalContainerProvider({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <OverlayPortalContainerContext.Provider value={value}>
      {children}
    </OverlayPortalContainerContext.Provider>
  );
}

export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (value: T | null) => void {
  return (value: T | null) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

