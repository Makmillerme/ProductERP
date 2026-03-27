"use client";

import {
  MGMT_TABLE_COL_MIN_WIDTH,
  type MgmtColPercents,
} from "@/config/management-table";

export function MgmtTableColGroup({ widths }: { widths: MgmtColPercents }) {
  return (
    <colgroup>
      {widths.map((w, i) => (
        <col
          key={i}
          style={{ width: `${w}%`, minWidth: MGMT_TABLE_COL_MIN_WIDTH }}
        />
      ))}
    </colgroup>
  );
}
