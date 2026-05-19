import type { TdrssPass } from "@/data/data-source";
import {
  formatHhMmSsCountdownRemainingMs,
  formatHhMmSsFromDurationMs,
} from "@/lib/dashboard-time";
import {
  LINK_PASS_UNAVAILABLE_DISPLAY,
  PLACEHOLDER_LINK_PASS_STATUS,
  type LinkPassEndpoint,
  type LinkPassStatusSnapshot,
} from "@/lib/link-pass-status";

type ParsedTdrssPass = {
  startMs: number;
  endMs: number;
};

function parsePass(pass: TdrssPass): ParsedTdrssPass | null {
  const startMs = Date.parse(pass.start);
  const endMs = Date.parse(pass.end);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return null;
  }
  return { startMs, endMs };
}

function groupPassesByBand(passes: TdrssPass[]) {
  const s: ParsedTdrssPass[] = [];
  const ku: ParsedTdrssPass[] = [];
  for (const pass of passes) {
    const parsed = parsePass(pass);
    if (!parsed) continue;
    if (pass.band === "s") s.push(parsed);
    else if (pass.band === "ku") ku.push(parsed);
  }
  return { s, ku };
}

export function findCurrentPass(
  nowMs: number,
  passes: ParsedTdrssPass[],
): ParsedTdrssPass | null {
  for (const pass of passes) {
    if (nowMs >= pass.startMs && nowMs < pass.endMs) return pass;
  }
  return null;
}

export function findNextPass(
  nowMs: number,
  passes: ParsedTdrssPass[],
): ParsedTdrssPass | null {
  let best: ParsedTdrssPass | null = null;
  for (const pass of passes) {
    if (pass.startMs <= nowMs) continue;
    if (!best || pass.startMs < best.startMs) best = pass;
  }
  return best;
}

function resolveBandEndpoint(
  nowMs: number,
  passes: ParsedTdrssPass[],
  fallback: LinkPassEndpoint,
): LinkPassEndpoint {
  const current = findCurrentPass(nowMs, passes);
  if (current) {
    return {
      aosActive: true,
      losActive: false,
      aosDisplay: `+${formatHhMmSsFromDurationMs(nowMs - current.startMs)}`,
      losDisplay: formatHhMmSsCountdownRemainingMs(current.endMs - nowMs),
    };
  }

  const next = findNextPass(nowMs, passes);
  if (next) {
    return {
      aosActive: false,
      losActive: true,
      aosDisplay: formatHhMmSsCountdownRemainingMs(next.startMs - nowMs),
      losDisplay: LINK_PASS_UNAVAILABLE_DISPLAY,
    };
  }

  return fallback;
}

let cachedPasses: TdrssPass[] | null = null;
let sBandPasses: ParsedTdrssPass[] = [];
let kuBandPasses: ParsedTdrssPass[] = [];

function ensurePassesGrouped(allPasses: TdrssPass[]) {
  if (cachedPasses === allPasses) return;
  const grouped = groupPassesByBand(allPasses);
  sBandPasses = grouped.s;
  kuBandPasses = grouped.ku;
  cachedPasses = allPasses;
}

export function resolveLinkPassStatus(
  nowMs: number,
  allPasses: TdrssPass[],
): LinkPassStatusSnapshot {
  ensurePassesGrouped(allPasses);

  return {
    sBand: resolveBandEndpoint(
      nowMs,
      sBandPasses,
      PLACEHOLDER_LINK_PASS_STATUS.sBand,
    ),
    kuBand: resolveBandEndpoint(
      nowMs,
      kuBandPasses,
      PLACEHOLDER_LINK_PASS_STATUS.kuBand,
    ),
  };
}
