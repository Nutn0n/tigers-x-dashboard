/**
 * Telemetry field types and API path placeholder for the microfluidic / camera stack.
 * Wire `TELEMETRY_API_PATH` (or a full URL) when the backend contract is ready.
 */

/** Relative path or full URL for the telemetry endpoint — set when the API exists. */
export const TELEMETRY_API_PATH = "";

/** `channel_id` enum — narrow when the API documents allowed values. */
export type TelemetryChannelId = string;

/** `pump_mode_a` / `pump_mode_b` enum — narrow when the API documents allowed values. */
export type TelemetryPumpMode = string;

/**
 * Single telemetry sample / snapshot (field names aligned with the payload contract).
 */
export type TelemetrySnapshot = {
  CamStatus1: boolean;
  CamStatus2: boolean;
  CamStatus3: boolean;
  CamStatus4: boolean;
  PumpStatus1: boolean;
  PumpStatus2: boolean;
  PumpStatus3: boolean;
  PumpStatus4: boolean;
  PumpStatus5: boolean;
  PumpStatus6: boolean;
  PumpStatus7: boolean;
  PumpStatus8: boolean;
  CaptureTime: number;
  /** Integer flag for command receive state. */
  CommandReceive: number;
  CommunicationStatus: boolean;
  Temperature: number;
  Torch_Level: number;
  TM_Counter: number;
  recipe_id: string;
  channel_id: TelemetryChannelId;
  capture_active: boolean;
  selected_camera_pair: string;
  pump_mode_a: TelemetryPumpMode;
  pump_mode_b: TelemetryPumpMode;
  event_marker: string;
  /** Fault identifier as string code or numeric code from hardware. */
  fault_code: string | number;
};
