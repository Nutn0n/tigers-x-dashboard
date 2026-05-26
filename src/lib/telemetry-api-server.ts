import type {
  TelemetryHealthResponse,
  TelemetryLatestResponse,
} from "@/lib/telemetry-api-types";
import { PUBLIC_TELEMETRY_API_TOKEN } from "@/lib/telemetry-api-client";

const DEFAULT_BASE_URL = "https://telemetry.ishalab.space";
const DEFAULT_TARGET = "pm";

function telemetryBaseUrl(): string {
  return (
    process.env.TELEMETRY_API_BASE_URL?.replace(/\/+$/, "") ?? DEFAULT_BASE_URL
  );
}

export function telemetryTarget(): string {
  return process.env.TELEMETRY_TARGET?.trim() || DEFAULT_TARGET;
}

function resolveToken(): string {
  return (
    process.env.TELEMETRY_API_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_TELEMETRY_API_TOKEN?.trim() ||
    PUBLIC_TELEMETRY_API_TOKEN
  );
}

function authHeaders(): HeadersInit {
  const token = resolveToken();
  if (!token) {
    throw new Error("TELEMETRY_API_TOKEN is not configured");
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

async function upstreamFetch(path: string): Promise<Response> {
  const url = `${telemetryBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
  });
}

export async function fetchTelemetryHealth(): Promise<TelemetryHealthResponse> {
  const res = await upstreamFetch("/health");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || `Telemetry health HTTP ${res.status}`,
      { cause: res.status },
    );
  }
  return (await res.json()) as TelemetryHealthResponse;
}

export async function fetchTelemetryLatest(
  target = telemetryTarget(),
): Promise<TelemetryLatestResponse> {
  const res = await upstreamFetch(`/latest/${encodeURIComponent(target)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || `Telemetry latest HTTP ${res.status}`,
      { cause: res.status },
    );
  }
  return (await res.json()) as TelemetryLatestResponse;
}

export function telemetryWebSocketUrl(): string {
  const base = telemetryBaseUrl();
  const wsBase = base.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  return `${wsBase}/ws`;
}

export function telemetryAuthToken(): string {
  return resolveToken();
}
