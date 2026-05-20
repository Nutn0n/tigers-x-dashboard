import type { ApiParameterValue } from "@/lib/telemetry-api-types";
import {
  createDefaultTelemetrySnapshot,
  TELEMETRY_SNAPSHOT_KEYS,
  type TelemetrySnapshot,
} from "@/lib/telemetry";

const BOOLEAN_KEYS = new Set<keyof TelemetrySnapshot>([
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
  "CommunicationStatus",
  "capture_active",
]);

const NUMBER_KEYS = new Set<keyof TelemetrySnapshot>([
  "CaptureTime",
  "CommandReceive",
  "Temperature",
  "Torch_Level",
  "TM_Counter",
]);

const STRING_KEYS = new Set<keyof TelemetrySnapshot>([
  "recipe_id",
  "channel_id",
  "selected_camera_pair",
  "pump_mode_a",
  "pump_mode_b",
  "event_marker",
]);

function isSnapshotKey(name: string): name is keyof TelemetrySnapshot {
  return (TELEMETRY_SNAPSHOT_KEYS as readonly string[]).includes(name);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "on") return true;
    if (lower === "false" || lower === "0" || lower === "off") return false;
  }
  return Boolean(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toFaultCode(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return toStringValue(value);
}

export function parseParameterValue(
  key: keyof TelemetrySnapshot,
  param: ApiParameterValue | { value: unknown },
): TelemetrySnapshot[keyof TelemetrySnapshot] {
  const raw = "value" in param ? param.value : param;

  if (BOOLEAN_KEYS.has(key)) return toBoolean(raw) as TelemetrySnapshot[typeof key];
  if (NUMBER_KEYS.has(key)) return toNumber(raw) as TelemetrySnapshot[typeof key];
  if (key === "fault_code") return toFaultCode(raw) as TelemetrySnapshot[typeof key];
  if (STRING_KEYS.has(key)) return toStringValue(raw) as TelemetrySnapshot[typeof key];

  return toStringValue(raw) as TelemetrySnapshot[typeof key];
}

export function applyApiParameters(
  snapshot: TelemetrySnapshot,
  parameters: Record<string, ApiParameterValue | { value: unknown }>,
): TelemetrySnapshot {
  const next = { ...snapshot };
  for (const [name, param] of Object.entries(parameters)) {
    if (!isSnapshotKey(name)) continue;
    const key = name;
    (next as Record<string, unknown>)[key] = parseParameterValue(key, param);
  }
  return next;
}

export function latestReceivedAtFromParameters(
  parameters: Record<string, ApiParameterValue>,
): string | null {
  let latest: string | null = null;
  for (const param of Object.values(parameters)) {
    const at = param.received_at;
    if (!at) continue;
    if (!latest || at > latest) latest = at;
  }
  return latest;
}

export function isStale(
  receivedAt: string | null,
  now: Date,
  thresholdMs = 5000,
): boolean {
  if (!receivedAt) return true;
  const t = Date.parse(receivedAt);
  if (Number.isNaN(t)) return true;
  return now.getTime() - t > thresholdMs;
}

export function mergeTelemetryUpdate(
  snapshot: TelemetrySnapshot,
  parameters: Record<string, ApiParameterValue>,
): { snapshot: TelemetrySnapshot; lastReceivedAt: string | null } {
  const next = applyApiParameters(snapshot, parameters);
  const paramReceived = latestReceivedAtFromParameters(parameters);
  return { snapshot: next, lastReceivedAt: paramReceived };
}

export function applyTargetSnapshot(
  snapshot: TelemetrySnapshot,
  targetParameters: Record<string, ApiParameterValue>,
): { snapshot: TelemetrySnapshot; lastReceivedAt: string | null } {
  const next = applyApiParameters(snapshot, targetParameters);
  return {
    snapshot: next,
    lastReceivedAt: latestReceivedAtFromParameters(targetParameters),
  };
}

export { createDefaultTelemetrySnapshot };
