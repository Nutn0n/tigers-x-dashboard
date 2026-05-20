"use client";

import { TelemetryConnectionStatus } from "@/components/telemetry-connection-status";
import { useTelemetry } from "@/components/telemetry-provider";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { DASHBOARD_PANEL_STACK_CLASS } from "@/lib/dashboard-panel-styles";

export function Telecommand() {
  const { snapshot, connection } = useTelemetry();
  const staleClass =
    connection === "stale" || connection === "unavailable" || connection === "error"
      ? "opacity-60"
      : "";

  return (
    <TitledDashboardPanel title="Telecommand" panelId="telecommand">
      <div className={DASHBOARD_PANEL_STACK_CLASS}>
        <TelemetryConnectionStatus />
        <table
          className={`w-full table-fixed border-collapse text-left text-[11px] sm:text-xs ${staleClass}`}
        >
          <tbody>
            <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                CommandReceive
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.CommandReceive}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </TitledDashboardPanel>
  );
}
