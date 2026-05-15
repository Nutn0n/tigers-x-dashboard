"use client";

import { useState } from "react";
import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { DASHBOARD_PANEL_SECTION_LABEL_CLASS } from "@/lib/dashboard-panel-styles";
import type { TelemetrySnapshot } from "@/lib/telemetry";

const PUMP_STATUS_KEYS = [
  "PumpStatus1",
  "PumpStatus2",
  "PumpStatus3",
  "PumpStatus4",
  "PumpStatus5",
  "PumpStatus6",
  "PumpStatus7",
  "PumpStatus8",
] as const satisfies ReadonlyArray<
  keyof Pick<
    TelemetrySnapshot,
    | "PumpStatus1"
    | "PumpStatus2"
    | "PumpStatus3"
    | "PumpStatus4"
    | "PumpStatus5"
    | "PumpStatus6"
    | "PumpStatus7"
    | "PumpStatus8"
  >
>;

type PumpStatusKey = (typeof PUMP_STATUS_KEYS)[number];

const defaultPumpFlags: Record<PumpStatusKey, boolean> = {
  PumpStatus1: false,
  PumpStatus2: false,
  PumpStatus3: false,
  PumpStatus4: false,
  PumpStatus5: false,
  PumpStatus6: false,
  PumpStatus7: false,
  PumpStatus8: false,
};

const PUMP_ROWS = [
  [PUMP_STATUS_KEYS[0], PUMP_STATUS_KEYS[1]],
  [PUMP_STATUS_KEYS[2], PUMP_STATUS_KEYS[3]],
  [PUMP_STATUS_KEYS[4], PUMP_STATUS_KEYS[5]],
  [PUMP_STATUS_KEYS[6], PUMP_STATUS_KEYS[7]],
] as const satisfies ReadonlyArray<readonly [PumpStatusKey, PumpStatusKey]>;

type PumpStatusTableProps = {
  /** Section caption above the table (e.g. "Pump status"). */
  caption?: string;
  /** No top border or padding (e.g. directly under a diagram). */
  flushTop?: boolean;
};

export function PumpStatusTable({
  caption = "Pump status",
  flushTop = false,
}: PumpStatusTableProps) {
  const [pumpFlags] = useState<Record<PumpStatusKey, boolean>>(defaultPumpFlags);

  return (
    <div
      className={`w-full shrink-0 ${flushTop ? "" : "border-t border-solid border-[color:var(--border)] pt-2 first:border-t-0 first:pt-0"}`}
    >
      <p className={DASHBOARD_PANEL_SECTION_LABEL_CLASS}>{caption}</p>
      <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
        <tbody>
          {PUMP_ROWS.map((pair) => (
            <tr
              key={pair.join("-")}
              className="border-t border-solid border-[#eee]/10 first:border-t-0"
            >
              {pair.flatMap((key, colIndex) => [
                <th
                  key={`${key}-label`}
                  scope="row"
                  className="w-[22%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  {key}
                </th>,
                <td
                  key={`${key}-value`}
                  className={`py-1 text-right ${colIndex === 0 ? "pr-2 sm:pr-4" : ""}`}
                >
                  <TelemetryBooleanChip field={key} value={pumpFlags[key]} />
                </td>,
              ])}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
