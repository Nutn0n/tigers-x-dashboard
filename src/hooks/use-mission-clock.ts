"use client";

import { useEffect, useState } from "react";

export function parseMissionEpochMs(epochIso: string): number {
  return Date.parse(epochIso);
}

export function isMissionEpochValid(epochMs: number): boolean {
  return Number.isFinite(epochMs) && epochMs > 0;
}

/** Live mission clock tick (1 Hz) when epoch is valid. */
export function useMissionClock(epochIso: string) {
  const epochMs = parseMissionEpochMs(epochIso);
  const epochOk = isMissionEpochValid(epochMs);

  const [nowMs, setNowMs] = useState(() => (epochOk ? Date.now() : 0));

  useEffect(() => {
    setNowMs(epochOk ? Date.now() : 0);
  }, [epochOk, epochMs]);

  useEffect(() => {
    if (!epochOk) return;
    const tick = () => setNowMs(Date.now());
    const timeoutId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [epochOk]);

  return { epochMs, epochOk, nowMs };
}
