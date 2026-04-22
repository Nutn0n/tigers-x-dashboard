export const ROW_CONFIG = [
  { label: "ISS Event", type: "iss-event" },
  { label: "COL/MPCC", type: "col-mpcc" },
  { label: "Chanel 1", type: "chanel-1" },
  { label: "Chanel 2", type: "chanel-2" },
  { label: "Chanel 3", type: "chanel-3" },
  { label: "Operation", type: "operation" },
] as const;

export type RowType = (typeof ROW_CONFIG)[number]["type"];

export type TimelineEvent = {
  id: string;
  name: string;
  type: string;
  start: string;
  end: string;
};

export const BASE_PX_PER_HOUR = 72;
export const TICK_STEP_HOURS = 6;
export const MIN_TIMELINE_SPAN_HOURS = 96;
const HOURS_PAD_AFTER_LAST_EVENT = 8;

export const MS_PER_HOUR = 3600 * 1000;

/**
 * 1-based mission day from wall time: each full 24h after `epochMs` advances the
 * day; the instant at `epochMs` is day 1. Returns null before mission start.
 */
export function missionDayNumberFromEpoch(
  nowMs: number,
  epochMs: number,
): number | null {
  if (!Number.isFinite(nowMs) || !Number.isFinite(epochMs) || epochMs <= 0) {
    return null;
  }
  const diff = nowMs - epochMs;
  if (diff < 0) return null;
  return Math.floor(diff / (MS_PER_HOUR * 24)) + 1;
}

/** Chanel 1–3 bars: vertical gradient (stops match → solid #D54722). */
const CHANEL_ORANGE = "#D54722";
export const CHANEL_ROW_VERTICAL_GRADIENT = `linear-gradient(180deg, ${CHANEL_ORANGE} 0%, ${CHANEL_ORANGE} 100%)`;

const DEFAULT_BAR_BG = "#434343";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function hoursSinceEpoch(epochMs: number, tMs: number) {
  return (tMs - epochMs) / MS_PER_HOUR;
}

export function computeSpanHours(epochMs: number, events: TimelineEvent[]) {
  let maxEndH = 0;
  for (const e of events) {
    const endMs = Date.parse(e.end);
    if (Number.isFinite(endMs)) {
      maxEndH = Math.max(maxEndH, hoursSinceEpoch(epochMs, endMs));
    }
  }
  return Math.max(
    MIN_TIMELINE_SPAN_HOURS,
    Math.ceil(maxEndH + HOURS_PAD_AFTER_LAST_EVENT),
  );
}

export function pxPerMsFromZoom(zoom: number) {
  return (BASE_PX_PER_HOUR * zoom) / MS_PER_HOUR;
}

export function barLeftWidthPx(
  epochMs: number,
  startMs: number,
  endMs: number,
  pxPerMs: number,
) {
  const left = (startMs - epochMs) * pxPerMs;
  const width = (endMs - startMs) * pxPerMs;
  return { left, width: Math.max(width, 6) };
}

function rowIndexForType(t: string): number | null {
  const i = ROW_CONFIG.findIndex((r) => r.type === t);
  return i >= 0 ? i : null;
}

export function barFillForRowType(rowType: RowType): string {
  if (
    rowType === "chanel-1" ||
    rowType === "chanel-2" ||
    rowType === "chanel-3"
  ) {
    return CHANEL_ORANGE;
  }
  return DEFAULT_BAR_BG;
}

/** Background for event bars (gradient on Chanel rows, flat fill elsewhere). */
export function barFillBackgroundStyle(rowType: RowType): {
  backgroundColor?: string;
  backgroundImage?: string;
} {
  if (
    rowType === "chanel-1" ||
    rowType === "chanel-2" ||
    rowType === "chanel-3"
  ) {
    return { backgroundImage: CHANEL_ROW_VERTICAL_GRADIENT };
  }
  return { backgroundColor: barFillForRowType(rowType) };
}

export function isOutlineOnlyLane(rowType: RowType): boolean {
  return rowType === "operation";
}

export function emptyEventsByRow(): Record<RowType, TimelineEvent[]> {
  const byRow = {} as Record<RowType, TimelineEvent[]>;
  for (const r of ROW_CONFIG) {
    byRow[r.type] = [];
  }
  return byRow;
}

export function bucketEventsByRow(
  events: TimelineEvent[],
): Record<RowType, TimelineEvent[]> {
  const byRow = emptyEventsByRow();
  for (const ev of events) {
    const idx = rowIndexForType(ev.type);
    if (idx === null) continue;
    const rowType = ROW_CONFIG[idx].type;
    byRow[rowType].push(ev);
  }
  return byRow;
}

/**
 * Active when nowMs ∈ [start, end). Rows are checked in ROW_CONFIG order so
 * narrower lanes (e.g. ISS) win over long operation blocks when both overlap.
 */
export function findCurrentTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  for (const row of ROW_CONFIG) {
    for (const ev of events) {
      if (ev.type !== row.type) continue;
      const startMs = Date.parse(ev.start);
      const endMs = Date.parse(ev.end);
      if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs <= startMs
      ) {
        continue;
      }
      if (nowMs >= startMs && nowMs < endMs) return ev;
    }
  }
  return null;
}

/** Earliest event with start strictly after nowMs; ties broken like current (row order, then file order). */
export function findNextTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  let best: {
    ev: TimelineEvent;
    startMs: number;
    rowIdx: number;
    fileIdx: number;
  } | null = null;

  for (let fileIdx = 0; fileIdx < events.length; fileIdx++) {
    const ev = events[fileIdx];
    const rowIdx = rowIndexForType(ev.type);
    if (rowIdx === null) continue;

    const startMs = Date.parse(ev.start);
    const endMs = Date.parse(ev.end);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      continue;
    }
    if (startMs <= nowMs) continue;

    if (
      !best ||
      startMs < best.startMs ||
      (startMs === best.startMs &&
        (rowIdx < best.rowIdx ||
          (rowIdx === best.rowIdx && fileIdx < best.fileIdx)))
    ) {
      best = { ev, startMs, rowIdx, fileIdx };
    }
  }

  return best === null ? null : best.ev;
}

const CHANEL_ROW_TYPES = ["chanel-1", "chanel-2", "chanel-3"] as const;

/**
 * Active chanel row only (chanel-1 → chanel-3 order). Same interval rule as
 * findCurrentTimelineEvent.
 */
export function findCurrentChanelTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  for (const rowType of CHANEL_ROW_TYPES) {
    for (const ev of events) {
      if (ev.type !== rowType) continue;
      const startMs = Date.parse(ev.start);
      const endMs = Date.parse(ev.end);
      if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs <= startMs
      ) {
        continue;
      }
      if (nowMs >= startMs && nowMs < endMs) return ev;
    }
  }
  return null;
}

/** Next upcoming chanel event only; same tie-break as findNextTimelineEvent. */
export function findNextChanelTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  let best: {
    ev: TimelineEvent;
    startMs: number;
    rowIdx: number;
    fileIdx: number;
  } | null = null;

  for (let fileIdx = 0; fileIdx < events.length; fileIdx++) {
    const ev = events[fileIdx];
    if (
      ev.type !== "chanel-1" &&
      ev.type !== "chanel-2" &&
      ev.type !== "chanel-3"
    ) {
      continue;
    }
    const rowIdx = rowIndexForType(ev.type);
    if (rowIdx === null) continue;

    const startMs = Date.parse(ev.start);
    const endMs = Date.parse(ev.end);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      continue;
    }
    if (startMs <= nowMs) continue;

    if (
      !best ||
      startMs < best.startMs ||
      (startMs === best.startMs &&
        (rowIdx < best.rowIdx ||
          (rowIdx === best.rowIdx && fileIdx < best.fileIdx)))
    ) {
      best = { ev, startMs, rowIdx, fileIdx };
    }
  }

  return best === null ? null : best.ev;
}

const STATION_ROW_TYPES = ["iss-event", "col-mpcc"] as const;

/**
 * Active ISS or COL/MPCC event only (ISS row checked before COL/MPCC on overlap).
 */
export function findCurrentStationTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  for (const rowType of STATION_ROW_TYPES) {
    for (const ev of events) {
      if (ev.type !== rowType) continue;
      const startMs = Date.parse(ev.start);
      const endMs = Date.parse(ev.end);
      if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs <= startMs
      ) {
        continue;
      }
      if (nowMs >= startMs && nowMs < endMs) return ev;
    }
  }
  return null;
}

/** Next upcoming ISS or COL/MPCC event only. */
export function findNextStationTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  let best: {
    ev: TimelineEvent;
    startMs: number;
    rowIdx: number;
    fileIdx: number;
  } | null = null;

  for (let fileIdx = 0; fileIdx < events.length; fileIdx++) {
    const ev = events[fileIdx];
    if (ev.type !== "iss-event" && ev.type !== "col-mpcc") continue;
    const rowIdx = rowIndexForType(ev.type);
    if (rowIdx === null) continue;

    const startMs = Date.parse(ev.start);
    const endMs = Date.parse(ev.end);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      continue;
    }
    if (startMs <= nowMs) continue;

    if (
      !best ||
      startMs < best.startMs ||
      (startMs === best.startMs &&
        (rowIdx < best.rowIdx ||
          (rowIdx === best.rowIdx && fileIdx < best.fileIdx)))
    ) {
      best = { ev, startMs, rowIdx, fileIdx };
    }
  }

  return best === null ? null : best.ev;
}

export function formatOffsetFromEpoch(epochMs: number, tMs: number) {
  let diffSec = Math.floor((tMs - epochMs) / 1000);
  if (diffSec < 0) diffSec = 0;
  const days = Math.floor(diffSec / 86400);
  const rem = diffSec % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  return `+${String(days).padStart(3, "0")}:${pad2(h)}:${pad2(m)}`;
}

export function nowLineLeftPx(
  nowMs: number,
  epochMs: number,
  pxPerMs: number,
) {
  return (nowMs - epochMs) * pxPerMs;
}

export function timelineTrackWidthPx(opts: {
  spanHours: number;
  pxPerHour: number;
  nowMs: number;
  epochMs: number;
  pxPerMs: number;
}): number {
  const { spanHours, pxPerHour, nowMs, epochMs } = opts;
  const nowH = Math.max(0, (nowMs - epochMs) / MS_PER_HOUR);
  const endH = Math.max(spanHours, nowH);
  return endH * pxPerHour;
}
