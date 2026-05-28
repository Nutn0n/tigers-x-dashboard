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
  mergeTelemetryUpdate,
} from "@/lib/telemetry-normalize";
import type {
  TelemetryConnectionState,
  TelemetryHealthSummary,
  TelemetryLiveState,
  TelemetrySnapshot,
} from "@/lib/telemetry";

const POLL_MS = 2000;
const STREAM_SILENCE_MS = 5000;
const RECONNECT_MS = 2000;
/** TM_Counter must change within this window to stay connected. */
const EPOCH_STALE_MS = 5000;

const TELEMETRY_REST_ENABLED = true;
/** Set false to use REST polling only (no WebSocket). */
const TELEMETRY_WEBSOCKET_ENABLED = false;

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

function resolveConnection(hasReceivedData: boolean): TelemetryConnectionState {
  return hasReceivedData ? "connected" : "disconnected";
}

function isEpochRunning(
  tmCounterChangedAt: number | null,
  now: Date,
): boolean {
  if (tmCounterChangedAt == null) return false;
  return now.getTime() - tmCounterChangedAt <= EPOCH_STALE_MS;
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const target = telemetryApiTarget();
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(
    createDefaultTelemetrySnapshot,
  );
  const [lastReceivedAt, setLastReceivedAt] = useState<string | null>(null);
  const [health, setHealth] = useState<TelemetryHealthSummary | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [wsError, setWsError] = useState(false);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [tmCounterChangedAt, setTmCounterChangedAt] = useState<number | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());

  const snapshotRef = useRef(snapshot);
  const lastTmCounterRef = useRef<number | null>(null);
  const lastStreamAtRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openWebSocketRef = useRef<() => void>(() => {});

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const commitSnapshot = useCallback(
    (next: TelemetrySnapshot, received: string | null) => {
      snapshotRef.current = next;
      setSnapshot(next);
      if (received) setLastReceivedAt(received);
      setHasReceivedData(true);
      setFetchFailed(false);
      if (lastTmCounterRef.current !== next.TM_Counter) {
        lastTmCounterRef.current = next.TM_Counter;
        setTmCounterChangedAt(Date.now());
      }
    },
    [],
  );

  const applyLatest = useCallback((data: TelemetryLatestResponse) => {
    const { snapshot: next, lastReceivedAt: received } = applyTargetSnapshot(
      snapshotRef.current,
      data.parameters,
    );
    commitSnapshot(next, received);
  }, [commitSnapshot]);

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
      lastStreamAtRef.current = Date.now();
    } catch {
      setFetchFailed(true);
    }
  }, [applyLatest, target]);

  const handleWsMessage = useCallback(
    (msg: WsMessage) => {
      lastStreamAtRef.current = Date.now();
      setWsError(false);
      setFetchFailed(false);
      if (msg.type === "snapshot") {
        const targetParams = msg.targets[target];
        if (!targetParams) return;
        const { snapshot: next, lastReceivedAt: received } = applyTargetSnapshot(
          snapshotRef.current,
          targetParams,
        );
        commitSnapshot(next, received);
        return;
      }
      if (msg.type === "telemetry_update" && msg.target === target) {
        const { snapshot: next, lastReceivedAt: received } = mergeTelemetryUpdate(
          snapshotRef.current,
          msg.parameters,
        );
        commitSnapshot(next, received);
      }
    },
    [commitSnapshot, target],
  );

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsOpen(false);
  }, []);

  const scheduleReconnect = useCallback(() => {
    closeWebSocket();
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      if (TELEMETRY_REST_ENABLED) {
        void fetchLatest().then(() => openWebSocketRef.current());
      } else {
        openWebSocketRef.current();
      }
    }, RECONNECT_MS);
  }, [closeWebSocket, fetchLatest]);

  const openWebSocket = useCallback(() => {
    if (!TELEMETRY_WEBSOCKET_ENABLED) return;
    closeWebSocket();

    const ws = new WebSocket(telemetryWebSocketUrlClient());
    wsRef.current = ws;

    ws.onopen = () => {
      setWsOpen(true);
      setWsError(false);
      lastStreamAtRef.current = Date.now();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        handleWsMessage(msg);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => {
      setWsError(true);
      scheduleReconnect();
    };

    ws.onclose = () => {
      setWsOpen(false);
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
      if (TELEMETRY_REST_ENABLED) {
        await fetchHealth();
        if (cancelled) return;
        await fetchLatest();
        if (cancelled) return;
      }
      if (TELEMETRY_WEBSOCKET_ENABLED) {
        openWebSocket();
      }
    }

    void bootstrap();

    const healthId = TELEMETRY_REST_ENABLED
      ? window.setInterval(() => {
          void fetchHealth();
        }, POLL_MS * 2)
      : undefined;

    const pollId = TELEMETRY_REST_ENABLED
      ? window.setInterval(() => {
          if (TELEMETRY_WEBSOCKET_ENABLED) {
            const silent =
              Date.now() - lastStreamAtRef.current > STREAM_SILENCE_MS;
            if (!silent) return;
          }
          void fetchLatest();
        }, POLL_MS)
      : undefined;

    return () => {
      cancelled = true;
      if (healthId !== undefined) window.clearInterval(healthId);
      if (pollId !== undefined) window.clearInterval(pollId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (TELEMETRY_WEBSOCKET_ENABLED) closeWebSocket();
    };
  }, [closeWebSocket, fetchHealth, fetchLatest, openWebSocket]);

  const connection = useMemo(
    () => resolveConnection(hasReceivedData),
    [hasReceivedData],
  );

  const epochRunning = useMemo(
    () => isEpochRunning(tmCounterChangedAt, now),
    [tmCounterChangedAt, now],
  );

  const healthForUi = useMemo((): TelemetryHealthSummary | null => {
    if (TELEMETRY_REST_ENABLED) return health;
    return {
      connected: wsOpen,
      lastError: wsError ? "WebSocket error" : null,
      lastMessageAt: lastReceivedAt,
    };
  }, [health, wsOpen, wsError, lastReceivedAt]);

  const value = useMemo<TelemetryContextValue>(
    () => ({
      snapshot,
      connection,
      epochRunning,
      lastReceivedAt,
      health: healthForUi,
    }),
    [snapshot, connection, epochRunning, lastReceivedAt, healthForUi],
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
