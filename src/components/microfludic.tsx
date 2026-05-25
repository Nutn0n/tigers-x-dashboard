"use client";

import { PumpStatusTable } from "@/components/pump-status-table";
import { useTelemetry } from "@/components/telemetry-provider";
import { TelemetryStringValueBox } from "@/components/telemetry-string-value-box";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import {
  DASHBOARD_PANEL_SECTION_DIVIDER_CLASS,
  DASHBOARD_PANEL_SECTION_LABEL_CLASS,
  DASHBOARD_PANEL_STACK_CLASS,
} from "@/lib/dashboard-panel-styles";

function faultCodeToDisplayString(code: string | number): string {
  if (typeof code === "number") return String(code);
  return code;
}

export function Microfludic() {
  const { snapshot } = useTelemetry();

  return (
    <TitledDashboardPanel
      title="Experiment Views"
      panelId="microfludic"
      variant="tallStrip"
    >
      <div className={DASHBOARD_PANEL_STACK_CLASS}>
        <div className="flex w-full justify-center">
          <img src="/chip.svg" alt="Microfluidic chip diagram" style={{ width: 250, height: "auto" }} />
        </div>

        <PumpStatusTable caption="Pump status" flushTop />

        <div className={DASHBOARD_PANEL_SECTION_DIVIDER_CLASS}>
          <div className="flex w-full justify-center">
            <img src="/pump.svg" alt="Pump diagram" style={{ width: 250, height: "auto" }} />
          </div>
          <p className={DASHBOARD_PANEL_SECTION_LABEL_CLASS}>Event & pump</p>
          <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
            <tbody>
              <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  Event Marker
                </th>
                <td className="py-1 text-right">
                  <TelemetryStringValueBox
                    field="event_marker"
                    value={snapshot.event_marker}
                  />
                </td>
              </tr>
              <tr className="border-t border-solid border-[#eee]/10">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  Pump Mode A
                </th>
                <td className="py-1 text-right">
                  <TelemetryStringValueBox
                    field="pump_mode_a"
                    value={snapshot.pump_mode_a}
                  />
                </td>
              </tr>
              <tr className="border-t border-solid border-[#eee]/10">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  Pump Mode B
                </th>
                <td className="py-1 text-right">
                  <TelemetryStringValueBox
                    field="pump_mode_b"
                    value={snapshot.pump_mode_b}
                  />
                </td>
              </tr>
              <tr className="border-t border-solid border-[#eee]/10">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  Fault Code
                </th>
                <td className="py-1 text-right">
                  <TelemetryStringValueBox
                    field="fault_code"
                    value={faultCodeToDisplayString(snapshot.fault_code)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </TitledDashboardPanel>
  );
}
