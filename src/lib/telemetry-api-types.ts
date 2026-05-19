/** Upstream REST / WebSocket shapes (public telemetry API). */

export type ApiParameterValue = {
  value: unknown;
  type?: string;
  status?: string;
  received_at?: string;
  acquisition_time?: string;
  generation_time?: string;
};

export type TelemetryHealthResponse = {
  api: string;
  targets?: Record<
    string,
    {
      connected: boolean;
      last_message_at?: string;
      last_error?: string | null;
    }
  >;
  latest_count?: Record<string, number>;
  catalog_count?: Record<string, number>;
};

export type TelemetryLatestResponse = {
  target: string;
  status?: { connected: boolean };
  parameters: Record<string, ApiParameterValue>;
};

export type WsSnapshotMessage = {
  type: "snapshot";
  targets: Record<string, Record<string, ApiParameterValue>>;
};

export type WsTelemetryUpdateMessage = {
  type: "telemetry_update";
  target: string;
  parameters: Record<string, ApiParameterValue>;
};

export type WsMessage = WsSnapshotMessage | WsTelemetryUpdateMessage;
