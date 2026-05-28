"use client";

import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { TelemetryConnectionStatus } from "@/components/telemetry-connection-status";
import { useTelemetry } from "@/components/telemetry-provider";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
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

const CAM_DISPLAY_NAMES: Record<CamStatusKey, string> = {
  CamStatus1: "Camera 1",
  CamStatus2: "Camera 2",
  CamStatus3: "Camera 3",
  CamStatus4: "Camera 4",
};

const CAM_ROWS = [
  [CAM_STATUS_KEYS[0], CAM_STATUS_KEYS[1]],
  [CAM_STATUS_KEYS[2], CAM_STATUS_KEYS[3]],
] as const satisfies ReadonlyArray<readonly [CamStatusKey, CamStatusKey]>;

export function Telemetry() {
  const { snapshot, connection } = useTelemetry();
  const staleClass =
    connection === "stale" || connection === "unavailable" || connection === "error"
      ? "opacity-60"
      : "";
  const illuminationPercent = Math.min(
    100,
    Math.max(0, Number(snapshot.Torch_Level) || 0),
  );

  return (
    <TitledDashboardPanel title="Telemetry" panelId="telemetry">
      <div className={DASHBOARD_PANEL_STACK_CLASS}>
        <TelemetryConnectionStatus />
        <div className="flex w-full justify-center">
          <img src="/payload.svg" alt="Payload diagram" style={{ width: 250, height: "auto" }} />
        </div>

        <table
          className={`w-full table-fixed border-collapse text-left text-[11px] sm:text-xs ${staleClass}`}
        >
          <tbody>
            <tr className="border-t border-solid border-[#eee]/10 first:border-t-0">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                Telemetry Epoch
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.TM_Counter}s
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
              >
                Illumination
              </th>
              <td className="py-1">
                <div className="flex items-center justify-end gap-2">
                  <div
                    className="h-2 w-20 overflow-hidden rounded-full bg-[#eee]/15"
                    role="progressbar"
                    aria-label="Illumination level"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={illuminationPercent}
                  >
                    <div
                      className="h-full bg-[#eee]"
                      style={{ width: `${illuminationPercent}%` }}
                    />
                  </div>
                  <span className="font-mono tabular-nums text-[#eee]/90">
                    {snapshot.Torch_Level}%
                  </span>
                </div>
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
                {snapshot.Temperature}°C
              </td>
            </tr>
            <tr className="border-t border-solid border-[#eee]/10">
              <th
                scope="row"
                className="w-[40%] py-1 pr-1 font-medium text-[#eee]/85 sm:pr-2"
                title="Integer flag for command receive state"
              >
                Command Receive
              </th>
              <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                {snapshot.CommandReceive}
              </td>
            </tr>
          </tbody>
        </table>

        <div className={DASHBOARD_PANEL_SECTION_DIVIDER_CLASS}>
          <div className="flex w-full justify-center">
            <img
              src="/camera.svg"
              alt="Camera diagram"
              style={{ width: 250, height: "auto" }}
            />
          </div>
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
                      {CAM_DISPLAY_NAMES[key]}
                    </th>,
                    <td
                      key={`${key}-value`}
                      className={`py-1 text-right ${colIndex === 0 ? "pr-2 sm:pr-4" : ""}`}
                    >
                      <TelemetryBooleanChip
                        field={key}
                        value={snapshot[key]}
                        trueLabel="Online"
                        falseLabel="Offline"
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
                  Capture Time
                </th>
                <td className="py-1 text-right font-mono tabular-nums text-[#eee]/90">
                  {snapshot.CaptureTime}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </TitledDashboardPanel>
  );
}
