"use client";

import { useTelemetry } from "@/components/telemetry-provider";
import type { TelemetryConnectionState } from "@/lib/telemetry";

const STATE_LABEL: Record<TelemetryConnectionState, string> = {
  connected: "Live",
  stale: "Stale",
  unavailable: "Unavailable",
  error: "Error",
};

const STATE_COLOR: Record<TelemetryConnectionState, string> = {
  connected: "#22c55e",
  stale: "#eab308",
  unavailable: "#6b7280",
  error: "#ef4444",
};

export function TelemetryConnectionStatus() {
  const { connection, health, lastReceivedAt } = useTelemetry();
  const color = STATE_COLOR[connection];
  const label = STATE_LABEL[connection];
  const detail =
    health?.lastError ??
    (lastReceivedAt ? `Last update ${lastReceivedAt}` : "No telemetry received yet");

  return (
    <div
      className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#eee]/70"
      title={detail}
    >
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden
      />
      <span className="font-medium text-[#eee]/90">{label}</span>
    </div>
  );
}
