"use client";

import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { useTelemetry } from "@/components/telemetry-provider";
import { TelemetryStringValueBox } from "@/components/telemetry-string-value-box";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { DashboardSchematicImage } from "@/components/dashboard-schematic-image";
import {
  DASHBOARD_PANEL_SECTION_DIVIDER_CLASS,
  DASHBOARD_PANEL_SECTION_LABEL_CLASS,
  DASHBOARD_PANEL_STACK_CLASS,
} from "@/lib/dashboard-panel-styles";
import type { TelemetrySnapshot } from "@/lib/telemetry";

const CAM_STATUS_KEYS = [
  "CamStatus1",
  "CamStatus2",
  "CamStatus3",
  "CamStatus4",
] as const satisfies ReadonlyArray<
  keyof Pick<
    TelemetrySnapshot,
    "CamStatus1" | "CamStatus2" | "CamStatus3" | "CamStatus4"
  >
>;

type CamStatusKey = (typeof CAM_STATUS_KEYS)[number];

const CAM_ROWS = [
  [CAM_STATUS_KEYS[0], CAM_STATUS_KEYS[1]],
  [CAM_STATUS_KEYS[2], CAM_STATUS_KEYS[3]],
] as const satisfies ReadonlyArray<readonly [CamStatusKey, CamStatusKey]>;

export function PayloadViewer() {
  const { snapshot } = useTelemetry();

  return (
    <TitledDashboardPanel title="Imaging System" panelId="payload-viewer">
      <div className={DASHBOARD_PANEL_STACK_CLASS}>
        <DashboardSchematicImage src="/camera.svg" alt="Camera diagram" />

        <div className="w-full shrink-0">
          <p className={DASHBOARD_PANEL_SECTION_LABEL_CLASS}>Camera status</p>
          <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
            <tbody>
              {CAM_ROWS.map((pair) => (
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
                      <TelemetryBooleanChip
                        field={key}
                        value={snapshot[key]}
                      />
                    </td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={DASHBOARD_PANEL_SECTION_DIVIDER_CLASS}>
          <p className={DASHBOARD_PANEL_SECTION_LABEL_CLASS}>Capture</p>
          <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
            <tbody>
              <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  capture_active
                </th>
                <td className="py-1 text-right">
                  <TelemetryBooleanChip
                    field="capture_active"
                    value={snapshot.capture_active}
                  />
                </td>
              </tr>
              <tr className="border-t border-solid border-[#eee]/10">
                <th
                  scope="row"
                  className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                >
                  selected_camera_pair
                </th>
                <td className="py-1 text-right">
                  <TelemetryStringValueBox
                    field="selected_camera_pair"
                    value={snapshot.selected_camera_pair}
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
