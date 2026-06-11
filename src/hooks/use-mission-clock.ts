"use client";

import { archiveNowMs } from "@/lib/archive-time";

export function parseMissionEpochMs(epochIso: string): number {
  return Date.parse(epochIso);
}

export function isMissionEpochValid(epochMs: number): boolean {
  return Number.isFinite(epochMs) && epochMs > 0;
}

/** Frozen mission clock at archive deactivation time. */
export function useMissionClock(epochIso: string) {
  const epochMs = parseMissionEpochMs(epochIso);
  const epochOk = isMissionEpochValid(epochMs);
  const nowMs = epochOk ? archiveNowMs : 0;

  return { epochMs, epochOk, nowMs };
}
