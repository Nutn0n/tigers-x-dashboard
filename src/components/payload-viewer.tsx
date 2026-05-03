"use client";

import { useState } from "react";
import { TelemetryBooleanChip } from "@/components/telemetry-boolean-chip";
import { TelemetryStringValueBox } from "@/components/telemetry-string-value-box";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { withBasePath } from "@/lib/app-path";
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

type PayloadCaptureFields = Pick<
  TelemetrySnapshot,
  "capture_active" | "selected_camera_pair"
>;

const defaultCamFlags: Record<CamStatusKey, boolean> = {
  CamStatus1: false,
  CamStatus2: false,
  CamStatus3: false,
  CamStatus4: false,
};

const defaultPayloadCapture: PayloadCaptureFields = {
  capture_active: false,
  selected_camera_pair: "",
};

const CAM_ROWS = [
  [CAM_STATUS_KEYS[0], CAM_STATUS_KEYS[1]],
  [CAM_STATUS_KEYS[2], CAM_STATUS_KEYS[3]],
] as const satisfies ReadonlyArray<readonly [CamStatusKey, CamStatusKey]>;

export function PayloadViewer() {
  const [camFlags] = useState<Record<CamStatusKey, boolean>>(defaultCamFlags);
  const [payloadCapture] = useState<PayloadCaptureFields>(defaultPayloadCapture);

  return (
    <TitledDashboardPanel title="Payload Viewer" panelId="payload-viewer">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
          <img
            src={withBasePath("/payload.svg")}
            alt="Payload diagram"
            className="max-h-full max-w-full object-contain object-center"
          />
        </div>

        <div className="shrink-0 border-t border-solid border-[color:var(--border)] pt-2">
          <p className="m-0 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
            Camera status
          </p>
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
                      <TelemetryBooleanChip field={key} value={camFlags[key]} />
                    </td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="m-0 mb-1.5 mt-3 border-t border-solid border-[color:var(--border)] pt-2 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
            Capture
          </p>
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
                    value={payloadCapture.capture_active}
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
                    value={payloadCapture.selected_camera_pair}
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
