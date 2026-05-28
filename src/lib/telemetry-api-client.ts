/**
 * Browser client for the TIGERS-X public telemetry API.
 * Token is public (NEXT_PUBLIC_*) — calls upstream directly from the dashboard.
 */

import type {
  TelemetryHealthResponse,
  TelemetryLatestResponse,
} from "@/lib/telemetry-api-types";

const DEFAULT_BASE_URL = "https://telemetry.ishalab.space";
const DEFAULT_TARGET = "pm";

/** Public read token (override via NEXT_PUBLIC_TELEMETRY_API_TOKEN). */
export const PUBLIC_TELEMETRY_API_TOKEN =
  "d114599811b081a391102baa8b84d886158dddd8aacce951f14b4abdac08871c";

export function telemetryApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TELEMETRY_API_BASE_URL?.replace(/\/+$/, "") ??
    DEFAULT_BASE_URL
  );
}

export function telemetryApiToken(): string {
  return (
    process.env.NEXT_PUBLIC_TELEMETRY_API_TOKEN?.trim() ||
    PUBLIC_TELEMETRY_API_TOKEN
  );
}

export function telemetryApiTarget(): string {
  return process.env.NEXT_PUBLIC_TELEMETRY_TARGET?.trim() || DEFAULT_TARGET;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${telemetryApiToken()}`,
    Accept: "application/json",
  };
}

async function clientFetch(path: string): Promise<Response> {
  const url = `${telemetryApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, { cache: "no-store", headers: authHeaders() });
}

export async function fetchTelemetryHealthClient(): Promise<TelemetryHealthResponse> {
  const res = await clientFetch("/health");
  if (!res.ok) {
    throw new Error(`Telemetry health HTTP ${res.status}`);
  }
  return (await res.json()) as TelemetryHealthResponse;
}

export async function fetchTelemetryLatestClient(
  target = telemetryApiTarget(),
): Promise<TelemetryLatestResponse> {
  const res = await clientFetch(`/latest/${encodeURIComponent(target)}`);
  if (!res.ok) {
    throw new Error(`Telemetry latest HTTP ${res.status}`);
  }
  return (await res.json()) as TelemetryLatestResponse;
}

/** WebSocket URL (token in query — browsers cannot set Authorization on WS). */
export function telemetryWebSocketUrlClient(): string {
  const base = telemetryApiBaseUrl();
  const wsBase = base.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  const token = encodeURIComponent(telemetryApiToken());
  return `${wsBase}/ws?token=${token}`;
}
