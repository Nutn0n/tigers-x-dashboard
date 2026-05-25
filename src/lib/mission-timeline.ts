export const ROW_CONFIG = [
  { label: "ISS Event", type: "iss-event" },
  { label: "COL/MPCC", type: "col-mpcc" },
  { label: "Chanel 1", type: "chanel-1" },
  { label: "Chanel 2", type: "chanel-2" },
  { label: "Chanel 3", type: "chanel-3" },
  { label: "Chanel 4", type: "chanel-4" },
  { label: "Operation", type: "operation" },
] as const;

export type RowType = (typeof ROW_CONFIG)[number]["type"];

export const TDRSS_ROW_CONFIG = [
  { label: "S Band", type: "tdrss-s", color: "#ffffff" },
  { label: "KU Band", type: "tdrss-ku", color: "rgb(29, 177, 0)" },
] as const;

export type TdrssRowType = (typeof TDRSS_ROW_CONFIG)[number]["type"];

export type TimelineBarRowType = RowType | TdrssRowType;

export function isTdrssRowType(rowType: string): rowType is TdrssRowType {
  return rowType === "tdrss-s" || rowType === "tdrss-ku";
}

export type TimelineEvent = {
  id: string;
  name: string;
  type: string;
  start: string;
  end: string;
  description?: string;
};

const DEFAULT_EVENT_DESCRIPTION =
  "No description has been provided for this activity.";

export function timelineEventDescription(event: TimelineEvent): string {
  const text = event.description?.trim();
  return text && text.length > 0 ? text : DEFAULT_EVENT_DESCRIPTION;
}

export type TimelineEventLayout = {
  event: TimelineEvent;
  lane: number;
  laneCount: number;
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
const CHANEL_ROW_VERTICAL_GRADIENT = `linear-gradient(180deg, ${CHANEL_ORANGE} 0%, ${CHANEL_ORANGE} 100%)`;

const DEFAULT_BAR_BG = "#434343";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function hoursSinceEpoch(epochMs: number, tMs: number) {
  return (tMs - epochMs) / MS_PER_HOUR;
}

function parseFiniteMs(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function computeTimelineStartMs(
  epochMs: number,
  events: TimelineEvent[],
): number {
  let minStartMs = epochMs;
  for (const e of events) {
    const startMs = parseFiniteMs(e.start);
    if (startMs === null) continue;
    minStartMs = Math.min(minStartMs, startMs);
  }
  return minStartMs;
}

export function computeSpanHours(timelineStartMs: number, events: TimelineEvent[]) {
  let maxEndH = 0;
  for (const e of events) {
    const endMs = parseFiniteMs(e.end);
    if (endMs === null) continue;
    maxEndH = Math.max(maxEndH, hoursSinceEpoch(timelineStartMs, endMs));
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
  timelineStartMs: number,
  startMs: number,
  endMs: number,
  pxPerMs: number,
) {
  const left = (startMs - timelineStartMs) * pxPerMs;
  const width = (endMs - startMs) * pxPerMs;
  return { left, width: Math.max(width, 6) };
}

function rowIndexForType(t: string): number | null {
  const i = ROW_CONFIG.findIndex((r) => r.type === t);
  return i >= 0 ? i : null;
}

function tdrssRowColor(rowType: string): string | null {
  const row = TDRSS_ROW_CONFIG.find((r) => r.type === rowType);
  return row?.color ?? null;
}

function barFillForRowType(rowType: TimelineBarRowType): string {
  const tdrssColor = tdrssRowColor(rowType);
  if (tdrssColor) return tdrssColor;
  if (
    rowType === "chanel-1" ||
    rowType === "chanel-2" ||
    rowType === "chanel-3" ||
    rowType === "chanel-4"
  ) {
    return CHANEL_ORANGE;
  }
  return DEFAULT_BAR_BG;
}

/** Background for event bars (gradient on Chanel rows, flat fill elsewhere). */
export function barFillBackgroundStyle(rowType: TimelineBarRowType): {
  backgroundColor?: string;
  backgroundImage?: string;
} {
  const tdrssColor = tdrssRowColor(rowType);
  if (tdrssColor) return { backgroundColor: tdrssColor };
  if (
    rowType === "chanel-1" ||
    rowType === "chanel-2" ||
    rowType === "chanel-3" ||
    rowType === "chanel-4"
  ) {
    return { backgroundImage: CHANEL_ROW_VERTICAL_GRADIENT };
  }
  return { backgroundColor: barFillForRowType(rowType) };
}

export function isOutlineOnlyLane(_rowType: TimelineBarRowType): boolean {
  return false;
}

export function mergeEventsForTimelineRange(
  mission: TimelineEvent[],
  tdrss: TimelineEvent[],
): TimelineEvent[] {
  return [...mission, ...tdrss];
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
 * Assign non-overlapping vertical lanes for simultaneous events in one row.
 * Events with invalid ranges are ignored.
 */
export function layoutEventsInRow(
  source: TimelineEvent[],
): TimelineEventLayout[] {
  const valid = source
    .map((event, originalIndex) => {
      const startMs = Date.parse(event.start);
      const endMs = Date.parse(event.end);
      return { event, startMs, endMs, originalIndex };
    })
    .filter(
      (x) =>
        Number.isFinite(x.startMs) &&
        Number.isFinite(x.endMs) &&
        x.endMs > x.startMs,
    )
    .sort((a, b) => {
      if (a.startMs !== b.startMs) return a.startMs - b.startMs;
      if (a.endMs !== b.endMs) return a.endMs - b.endMs;
      return a.originalIndex - b.originalIndex;
    });

  const laneEndMs: number[] = [];
  const assigned: Array<{
    event: TimelineEvent;
    lane: number;
    order: number;
  }> = [];

  for (let order = 0; order < valid.length; order++) {
    const item = valid[order];
    let lane = -1;
    for (let i = 0; i < laneEndMs.length; i++) {
      if (laneEndMs[i] <= item.startMs) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEndMs.length;
      laneEndMs.push(item.endMs);
    } else {
      laneEndMs[lane] = item.endMs;
    }
    assigned.push({ event: item.event, lane, order });
  }

  const laneCount = Math.max(1, laneEndMs.length);
  return assigned
    .sort((a, b) => a.order - b.order)
    .map((x) => ({ event: x.event, lane: x.lane, laneCount }));
}

export function layoutEventsByRow(
  eventsByRow: Record<RowType, TimelineEvent[]>,
): Record<RowType, TimelineEventLayout[]> {
  const out = {} as Record<RowType, TimelineEventLayout[]>;

  for (const row of ROW_CONFIG) {
    out[row.type] = layoutEventsInRow(eventsByRow[row.type]);
  }

  return out;
}

export function emptyTdrssEventsByRow(): Record<TdrssRowType, TimelineEvent[]> {
  const byRow = {} as Record<TdrssRowType, TimelineEvent[]>;
  for (const r of TDRSS_ROW_CONFIG) {
    byRow[r.type] = [];
  }
  return byRow;
}

export function bucketTdrssEventsByRow(
  events: TimelineEvent[],
): Record<TdrssRowType, TimelineEvent[]> {
  const byRow = emptyTdrssEventsByRow();
  for (const ev of events) {
    if (ev.type === "tdrss-s") byRow["tdrss-s"].push(ev);
    else if (ev.type === "tdrss-ku") byRow["tdrss-ku"].push(ev);
  }
  return byRow;
}

export function layoutTdrssEventsByRow(
  eventsByRow: Record<TdrssRowType, TimelineEvent[]>,
): Record<TdrssRowType, TimelineEventLayout[]> {
  const out = {} as Record<TdrssRowType, TimelineEventLayout[]>;
  for (const row of TDRSS_ROW_CONFIG) {
    out[row.type] = layoutEventsInRow(eventsByRow[row.type]);
  }
  return out;
}

/** Visible wall-time window from horizontal scroll position. */
export function visibleTimeRangeMs(
  scrollLeftPx: number,
  viewportWidthPx: number,
  timelineStartMs: number,
  pxPerMs: number,
  bufferPx = 400,
): { startMs: number; endMs: number } {
  const startMs =
    timelineStartMs + (scrollLeftPx - bufferPx) / Math.max(pxPerMs, 1e-9);
  const endMs =
    timelineStartMs +
    (scrollLeftPx + viewportWidthPx + bufferPx) / Math.max(pxPerMs, 1e-9);
  return { startMs, endMs };
}

/** Keep layouts whose pass interval intersects [startMs, endMs). */
export function filterLayoutsInTimeRange(
  layouts: TimelineEventLayout[],
  startMs: number,
  endMs: number,
): TimelineEventLayout[] {
  return layouts.filter((layout) => {
    const passStart = Date.parse(layout.event.start);
    const passEnd = Date.parse(layout.event.end);
    if (
      !Number.isFinite(passStart) ||
      !Number.isFinite(passEnd) ||
      passEnd <= passStart
    ) {
      return false;
    }
    return passEnd > startMs && passStart < endMs;
  });
}

const CHANEL_ROW_TYPES = [
  "chanel-1",
  "chanel-2",
  "chanel-3",
  "chanel-4",
] as const;

/**
 * Active chanel row only (chanel-1 → chanel-4 order). nowMs ∈ [start, end).
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

/** Next upcoming chanel event only (row order, then file order). */
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
      ev.type !== "chanel-3" &&
      ev.type !== "chanel-4"
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
const ISS_EVENT_TYPES = ["iss-event"] as const;

type RankedTimelineEvent = {
  ev: TimelineEvent;
  startMs: number;
  rowIdx: number;
  fileIdx: number;
};

function eventTypeAllowed(type: string, allowed: readonly string[]): boolean {
  return allowed.includes(type);
}

/**
 * Active window for allowed types. When multiple overlap, picks the latest start;
 * ties prefer lower row index, then earlier file order.
 */
function findCurrentEventForTypes(
  nowMs: number,
  events: TimelineEvent[],
  allowedTypes: readonly string[],
): TimelineEvent | null {
  let best: RankedTimelineEvent | null = null;

  for (let fileIdx = 0; fileIdx < events.length; fileIdx++) {
    const ev = events[fileIdx];
    if (!eventTypeAllowed(ev.type, allowedTypes)) continue;

    const rowIdx = rowIndexForType(ev.type);
    if (rowIdx === null) continue;

    const startMs = parseFiniteMs(ev.start);
    const endMs = parseFiniteMs(ev.end);
    if (startMs === null || endMs === null || endMs <= startMs) continue;
    if (nowMs < startMs || nowMs >= endMs) continue;

    if (
      !best ||
      startMs > best.startMs ||
      (startMs === best.startMs &&
        (rowIdx < best.rowIdx ||
          (rowIdx === best.rowIdx && fileIdx < best.fileIdx)))
    ) {
      best = { ev, startMs, rowIdx, fileIdx };
    }
  }

  return best?.ev ?? null;
}

/** Next upcoming event for allowed types (earliest start). */
function findNextEventForTypes(
  nowMs: number,
  events: TimelineEvent[],
  allowedTypes: readonly string[],
): TimelineEvent | null {
  let best: RankedTimelineEvent | null = null;

  for (let fileIdx = 0; fileIdx < events.length; fileIdx++) {
    const ev = events[fileIdx];
    if (!eventTypeAllowed(ev.type, allowedTypes)) continue;

    const rowIdx = rowIndexForType(ev.type);
    if (rowIdx === null) continue;

    const startMs = parseFiniteMs(ev.start);
    const endMs = parseFiniteMs(ev.end);
    if (startMs === null || endMs === null || endMs <= startMs) continue;
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

  return best?.ev ?? null;
}

/**
 * Active ISS or COL/MPCC window containing `nowMs`. When multiple overlap (e.g.
 * short ISS window inside a longer COL/MPCC block), picks the **latest start**
 * so the UI matches the innermost / most recently begun station activity; ties
 * on equal start prefer ISS over COL/MPCC, then earlier file order.
 */
export function findCurrentStationTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  return findCurrentEventForTypes(nowMs, events, STATION_ROW_TYPES);
}

/** Next upcoming ISS or COL/MPCC event only. */
export function findNextStationTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  return findNextEventForTypes(nowMs, events, STATION_ROW_TYPES);
}

/** Active ISS event window containing `nowMs` (iss-event row only). */
export function findCurrentIssTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  return findCurrentEventForTypes(nowMs, events, ISS_EVENT_TYPES);
}

/** Next upcoming ISS event only (iss-event row). */
export function findNextIssTimelineEvent(
  nowMs: number,
  events: TimelineEvent[],
): TimelineEvent | null {
  return findNextEventForTypes(nowMs, events, ISS_EVENT_TYPES);
}

function timelineEventStartMs(ev: TimelineEvent): number | null {
  return parseFiniteMs(ev.start);
}

function pickSoonerTimelineEvent(
  a: TimelineEvent,
  b: TimelineEvent,
): TimelineEvent {
  const aStart = timelineEventStartMs(a);
  const bStart = timelineEventStartMs(b);
  if (aStart == null) return b;
  if (bStart == null) return a;
  return bStart < aStart ? b : a;
}

/** Current chanel → current ISS → soonest next chanel/ISS (for Activity Description). */
export function resolveActivityDescriptionDisplay(
  nowMs: number,
  events: TimelineEvent[],
): { event: TimelineEvent; showNextPill: boolean } | null {
  const currentChanel = findCurrentChanelTimelineEvent(nowMs, events);
  if (currentChanel) {
    return { event: currentChanel, showNextPill: false };
  }

  const currentIss = findCurrentIssTimelineEvent(nowMs, events);
  if (currentIss) {
    return { event: currentIss, showNextPill: false };
  }

  const nextChanel = findNextChanelTimelineEvent(nowMs, events);
  const nextIss = findNextIssTimelineEvent(nowMs, events);

  const next =
    nextChanel && nextIss
      ? pickSoonerTimelineEvent(nextChanel, nextIss)
      : (nextChanel ?? nextIss);
  if (next) {
    return { event: next, showNextPill: true };
  }

  return null;
}

export function formatOffsetFromEpoch(epochMs: number, tMs: number) {
  let diffSec = Math.floor((tMs - epochMs) / 1000);
  const sign = diffSec < 0 ? "-" : "+";
  diffSec = Math.abs(diffSec);
  const days = Math.floor(diffSec / 86400);
  const rem = diffSec % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  return `${sign}${String(days).padStart(3, "0")}:${pad2(h)}:${pad2(m)}`;
}

export function nowLineLeftPx(
  nowMs: number,
  timelineStartMs: number,
  pxPerMs: number,
) {
  return (nowMs - timelineStartMs) * pxPerMs;
}

export function timelineTrackWidthPx(opts: {
  spanHours: number;
  pxPerHour: number;
  nowMs: number;
  timelineStartMs: number;
  pxPerMs: number;
}): number {
  const { spanHours, pxPerHour, nowMs, timelineStartMs } = opts;
  const nowH = Math.max(0, (nowMs - timelineStartMs) / MS_PER_HOUR);
  const endH = Math.max(spanHours, nowH);
  return endH * pxPerHour;
}
