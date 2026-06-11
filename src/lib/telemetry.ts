/** Telemetry field types — keys match the payload contract. */

export type TelemetryChannelId = string;
export type TelemetryPumpMode = string;

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
  fault_code: string | number;
};
