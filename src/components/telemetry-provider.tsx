"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchTelemetryHealthClient,
  fetchTelemetryLatestClient,
  telemetryApiTarget,
  telemetryWebSocketUrlClient,
} from "@/lib/telemetry-api-client";
import type {
  TelemetryHealthResponse,
  TelemetryLatestResponse,
  WsMessage,
} from "@/lib/telemetry-api-types";
import {
  applyTargetSnapshot,
  createDefaultTelemetrySnapshot,
  isStale,
  mergeTelemetryUpdate,
} from "@/lib/telemetry-normalize";
import type {
  TelemetryConnectionState,
  TelemetryHealthSummary,
  TelemetryLiveState,
  TelemetrySnapshot,
} from "@/lib/telemetry";

const POLL_MS = 2000;
const STALE_MS = 5000;
const STREAM_SILENCE_MS = 5000;
const RECONNECT_MS = 2000;

type TelemetryContextValue = TelemetryLiveState;

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

function healthSummaryFromResponse(
  data: TelemetryHealthResponse,
  target: string,
): TelemetryHealthSummary {
  const t = data.targets?.[target];
  return {
    connected: t?.connected ?? false,
    lastError: t?.last_error ?? null,
    lastMessageAt: t?.last_message_at ?? null,
  };
}

function resolveConnection(
  health: TelemetryHealthSummary | null,
  lastReceivedAt: string | null,
  fetchFailed: boolean,
  now: Date,
): TelemetryConnectionState {
  if (fetchFailed) return "error";
  if (!health?.connected) return "unavailable";
  if (isStale(lastReceivedAt, now, STALE_MS)) return "stale";
  return "connected";
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const target = telemetryApiTarget();
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(
    createDefaultTelemetrySnapshot,
  );
  const [lastReceivedAt, setLastReceivedAt] = useState<string | null>(null);
  const [health, setHealth] = useState<TelemetryHealthSummary | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const snapshotRef = useRef(snapshot);
  const lastStreamAtRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollOnlyRef = useRef(false);
  const openWebSocketRef = useRef<() => void>(() => {});

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const applyLatest = useCallback((data: TelemetryLatestResponse) => {
    const { snapshot: next, lastReceivedAt: received } = applyTargetSnapshot(
      snapshotRef.current,
      data.parameters,
    );
    snapshotRef.current = next;
    setSnapshot(next);
    if (received) setLastReceivedAt(received);
    setFetchFailed(false);
  }, []);

  const fetchHealth = useCallback(async (): Promise<TelemetryHealthSummary | null> => {
    try {
      const data = await fetchTelemetryHealthClient();
      const summary = healthSummaryFromResponse(data, target);
      setHealth(summary);
      setFetchFailed(false);
      return summary;
    } catch {
      setFetchFailed(true);
      return null;
    }
  }, [target]);

  const fetchLatest = useCallback(async () => {
    try {
      const data = await fetchTelemetryLatestClient(target);
      applyLatest(data);
    } catch {
      setFetchFailed(true);
    }
  }, [applyLatest, target]);

  const handleWsMessage = useCallback(
    (msg: WsMessage) => {
      lastStreamAtRef.current = Date.now();
      if (msg.type === "snapshot") {
        const targetParams = msg.targets[target];
        if (!targetParams) return;
        const { snapshot: next, lastReceivedAt: received } = applyTargetSnapshot(
          snapshotRef.current,
          targetParams,
        );
        snapshotRef.current = next;
        setSnapshot(next);
        if (received) setLastReceivedAt(received);
        return;
      }
      if (msg.type === "telemetry_update" && msg.target === target) {
        const { snapshot: next, lastReceivedAt: received } = mergeTelemetryUpdate(
          snapshotRef.current,
          msg.parameters,
        );
        snapshotRef.current = next;
        setSnapshot(next);
        if (received) setLastReceivedAt(received);
      }
    },
    [target],
  );

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    closeWebSocket();
    pollOnlyRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      pollOnlyRef.current = false;
      void fetchLatest().then(() => openWebSocketRef.current());
    }, RECONNECT_MS);
  }, [closeWebSocket, fetchLatest]);

  const openWebSocket = useCallback(() => {
    if (pollOnlyRef.current) return;
    closeWebSocket();

    const ws = new WebSocket(telemetryWebSocketUrlClient());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        handleWsMessage(msg);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => {
      scheduleReconnect();
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        scheduleReconnect();
      }
    };
  }, [closeWebSocket, handleWsMessage, scheduleReconnect]);

  useEffect(() => {
    openWebSocketRef.current = openWebSocket;
  }, [openWebSocket]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      lastStreamAtRef.current = Date.now();
      await fetchHealth();
      if (cancelled) return;
      await fetchLatest();
      if (cancelled) return;
      openWebSocket();
    }

    void bootstrap();

    const healthId = window.setInterval(() => {
      void fetchHealth();
    }, POLL_MS * 2);

    const pollId = window.setInterval(() => {
      const silent = Date.now() - lastStreamAtRef.current > STREAM_SILENCE_MS;
      if (pollOnlyRef.current || silent) {
        void fetchLatest();
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(healthId);
      window.clearInterval(pollId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      closeWebSocket();
    };
  }, [closeWebSocket, fetchHealth, fetchLatest, openWebSocket]);

  const connection = useMemo(
    () => resolveConnection(health, lastReceivedAt, fetchFailed, now),
    [health, lastReceivedAt, fetchFailed, now],
  );

  const value = useMemo<TelemetryContextValue>(
    () => ({
      snapshot,
      connection,
      lastReceivedAt,
      health,
    }),
    [snapshot, connection, lastReceivedAt, health],
  );

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetry must be used within TelemetryProvider");
  }
  return ctx;
}
