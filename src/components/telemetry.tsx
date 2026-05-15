"use client";

import { useState } from "react";
import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import {
  DASHBOARD_SCHEMATIC_IMAGE_CLASS,
  DASHBOARD_SCHEMATIC_IMAGE_WRAPPER_CLASS,
} from "@/lib/dashboard-panel-styles";
import { withBasePath } from "@/lib/app-path";
import type { TelemetrySnapshot } from "@/lib/telemetry";

type TelemetryPanelFields = Pick<
  TelemetrySnapshot,
  "TM_Counter" | "Torch_Level" | "CommunicationStatus" | "CommandReceive"
>;

const defaultTelemetryFields: TelemetryPanelFields = {
  TM_Counter: 0,
  Torch_Level: 0,
  CommunicationStatus: false,
  CommandReceive: 0,
};

export function Telemetry() {
  const [fields] = useState<TelemetryPanelFields>(defaultTelemetryFields);

  return (
    <TitledDashboardPanel title="Telemetry" panelId="telemetry">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden">
        <div className={DASHBOARD_SCHEMATIC_IMAGE_WRAPPER_CLASS}>
          <img
            src={withBasePath("/payload.svg")}
            alt="Payload diagram"
            className={DASHBOARD_SCHEMATIC_IMAGE_CLASS}
          />
        </div>

        <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
        <tbody>
          <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
            <th
              scope="row"
              className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
            >
              TM_Counter
            </th>
            <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
              {fields.TM_Counter}
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
              {fields.Torch_Level}
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
                value={fields.CommunicationStatus}
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
              {fields.CommandReceive}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </TitledDashboardPanel>
  );
}
