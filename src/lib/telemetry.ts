/**
 * Telemetry field types — keys match upstream API parameter names exactly.
 */

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

export const TELEMETRY_SNAPSHOT_KEYS = [
  "CamStatus1",
  "CamStatus2",
  "CamStatus3",
  "CamStatus4",
  "PumpStatus1",
  "PumpStatus2",
  "PumpStatus3",
  "PumpStatus4",
  "PumpStatus5",
  "PumpStatus6",
  "PumpStatus7",
  "PumpStatus8",
  "CaptureTime",
  "CommandReceive",
  "Temperature",
  "Torch_Level",
  "TM_Counter",
  "recipe_id",
  "channel_id",
  "capture_active",
  "selected_camera_pair",
  "pump_mode_a",
  "pump_mode_b",
  "event_marker",
  "fault_code",
] as const satisfies ReadonlyArray<keyof TelemetrySnapshot>;

export function createDefaultTelemetrySnapshot(): TelemetrySnapshot {
  return {
    CamStatus1: false,
    CamStatus2: false,
    CamStatus3: false,
    CamStatus4: false,
    PumpStatus1: false,
    PumpStatus2: false,
    PumpStatus3: false,
    PumpStatus4: false,
    PumpStatus5: false,
    PumpStatus6: false,
    PumpStatus7: false,
    PumpStatus8: false,
    CaptureTime: 0,
    CommandReceive: 0,
    Temperature: 0,
    Torch_Level: 0,
    TM_Counter: 0,
    recipe_id: "",
    channel_id: "",
    capture_active: false,
    selected_camera_pair: "",
    pump_mode_a: "",
    pump_mode_b: "",
    event_marker: "",
    fault_code: "",
  };
}

export type TelemetryConnectionState = "connected" | "disconnected";

export type TelemetryHealthSummary = {
  connected: boolean;
  lastError: string | null;
  lastMessageAt: string | null;
};

export type TelemetryLiveState = {
  snapshot: TelemetrySnapshot;
  connection: TelemetryConnectionState;
  /** True when Telemetry Epoch (TM_Counter) is advancing. */
  epochRunning: boolean;
  lastReceivedAt: string | null;
  health: TelemetryHealthSummary | null;
};
