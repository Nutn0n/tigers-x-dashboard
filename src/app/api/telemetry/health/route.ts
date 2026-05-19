import { NextResponse } from "next/server";
import { fetchTelemetryHealth } from "@/lib/telemetry-api-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchTelemetryHealth();
    return NextResponse.json(data);
  } catch (err) {
    const status =
      typeof err === "object" &&
      err !== null &&
      "cause" in err &&
      typeof (err as { cause: unknown }).cause === "number"
        ? (err as { cause: number }).cause
        : 502;
    const message =
      err instanceof Error ? err.message : "Telemetry health request failed";
    if (message.includes("TELEMETRY_API_TOKEN")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json(
      { error: message },
      { status: status === 401 ? 401 : 502 },
    );
  }
}
