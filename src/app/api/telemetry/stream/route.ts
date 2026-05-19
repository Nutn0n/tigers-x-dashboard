import WebSocket from "ws";
import {
  telemetryAuthToken,
  telemetryWebSocketUrl,
} from "@/lib/telemetry-api-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function rawToUtf8(raw: WebSocket.RawData): string {
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf8");
  return String(raw);
}

export async function GET() {
  const encoder = new TextEncoder();

  let upstream: WebSocket | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* stream closed */
        }
      };

      try {
        upstream = new WebSocket(telemetryWebSocketUrl(), {
          headers: {
            Authorization: `Bearer ${telemetryAuthToken()}`,
          },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "WebSocket setup failed";
        enqueue({ type: "error", error: message });
        controller.close();
        return;
      }

      upstream.on("message", (raw) => {
        try {
          const text = rawToUtf8(raw);
          const data = JSON.parse(text) as unknown;
          enqueue(data);
        } catch {
          /* ignore malformed upstream frames */
        }
      });

      upstream.on("error", () => {
        try {
          enqueue({ type: "error", error: "upstream_websocket_error" });
        } finally {
          controller.close();
        }
      });

      upstream.on("close", () => {
        controller.close();
      });
    },
    cancel() {
      if (upstream && upstream.readyState === WebSocket.OPEN) {
        upstream.close();
      }
      upstream = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
