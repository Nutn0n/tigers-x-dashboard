"use client";

import { useState } from "react";
import { PumpStatusTable } from "@/components/pump-status-table";
import { TelemetryStringValueBox } from "@/components/telemetry-string-value-box";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import type { TelemetrySnapshot } from "@/lib/telemetry";

type MicrofludicTelemetryFields = Pick<
  TelemetrySnapshot,
  "event_marker" | "pump_mode_a" | "pump_mode_b" | "fault_code"
>;

const defaultMicrofludicTelemetry: MicrofludicTelemetryFields = {
  event_marker: "",
  pump_mode_a: "",
  pump_mode_b: "",
  fault_code: "",
};

function faultCodeToDisplayString(code: MicrofludicTelemetryFields["fault_code"]): string {
  if (typeof code === "number") return String(code);
  return code;
}

export function Microfludic() {
  const [telemetryFields] = useState<MicrofludicTelemetryFields>(
    defaultMicrofludicTelemetry,
  );

  return (
    <TitledDashboardPanel
      title="Microfludic Views"
      panelId="microfludic"
      variant="tallStrip"
    >
      <PumpStatusTable caption="Pump status" />

      <div className="w-full shrink-0 border-t border-solid border-[color:var(--border)] pt-2">
        <p className="m-0 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
          Event & pump
        </p>
        <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
          <tbody>
            <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                event_marker
              </th>
              <td className="py-1 text-right">
                <TelemetryStringValueBox
                  field="event_marker"
                  value={telemetryFields.event_marker}
                />
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                pump_mode_a
              </th>
              <td className="py-1 text-right">
                <TelemetryStringValueBox
                  field="pump_mode_a"
                  value={telemetryFields.pump_mode_a}
                />
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                pump_mode_b
              </th>
              <td className="py-1 text-right">
                <TelemetryStringValueBox
                  field="pump_mode_b"
                  value={telemetryFields.pump_mode_b}
                />
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                fault_code
              </th>
              <td className="py-1 text-right">
                <TelemetryStringValueBox
                  field="fault_code"
                  value={faultCodeToDisplayString(telemetryFields.fault_code)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </TitledDashboardPanel>
  );
}
