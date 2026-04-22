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
