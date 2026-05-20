"use client";

import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { TelemetryConnectionStatus } from "@/components/telemetry-connection-status";
import { useTelemetry } from "@/components/telemetry-provider";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { DashboardSchematicImage } from "@/components/dashboard-schematic-image";
import { DASHBOARD_PANEL_STACK_CLASS } from "@/lib/dashboard-panel-styles";

export function Telemetry() {
  const { snapshot, connection } = useTelemetry();
  const staleClass =
    connection === "stale" || connection === "unavailable" || connection === "error"
      ? "opacity-60"
      : "";

  return (
    <TitledDashboardPanel title="Telemetry" panelId="telemetry">
      <div className={DASHBOARD_PANEL_STACK_CLASS}>
        <TelemetryConnectionStatus />
        <DashboardSchematicImage src="/payload.svg" alt="Payload diagram" />

        <table
          className={`w-full table-fixed border-collapse text-left text-[11px] sm:text-xs ${staleClass}`}
        >
          <tbody>
            <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                TM_Counter
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.TM_Counter}
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                Torch_Level
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.Torch_Level}
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                Temperature
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.Temperature}
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                CaptureTime
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.CaptureTime}
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                CommunicationStatus
              </th>
              <td className="py-1 text-right">
                <TelemetryBooleanChip
                  field="CommunicationStatus"
                  value={snapshot.CommunicationStatus}
                />
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                title="Integer flag for command receive state"
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
