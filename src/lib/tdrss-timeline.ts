import { tdrssPasses } from "@/data/data-source";
import type { TdrssPass } from "@/data/data-source";
import {
  bucketTdrssEventsByRow,
  layoutTdrssEventsByRow,
  type TimelineEvent,
  type TimelineEventLayout,
  type TdrssRowType,
} from "@/lib/mission-timeline";

function isValidPass(pass: TdrssPass): boolean {
  const startMs = Date.parse(pass.start);
  const endMs = Date.parse(pass.end);
  return (
    Number.isFinite(startMs) &&
    Number.isFinite(endMs) &&
    endMs > startMs
  );
}

/** Convert TDRSS pass windows into timeline events (one bar per pass, AOS→LOS). */
export function tdrssPassesToTimelineEvents(
  passes: TdrssPass[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const pass of passes) {
    if (!isValidPass(pass)) continue;
    const rowType = pass.band === "s" ? "tdrss-s" : "tdrss-ku";
    const name = pass.band === "s" ? "S-Band" : "KU-Band";
    events.push({
      id: `tdrss-${pass.band}-${pass.start}`,
      name,
      type: rowType,
      start: pass.start,
      end: pass.end,
    });
  }
  return events;
}

/** Precomputed at module load — TDRSS schedule is static. */
export const TDRSS_TIMELINE_EVENTS = tdrssPassesToTimelineEvents(tdrssPasses);

const tdrssEventsByRow = bucketTdrssEventsByRow(TDRSS_TIMELINE_EVENTS);

/** Precomputed lane layouts per TDRSS sub-row. */
export const TDRSS_TIMELINE_LAYOUTS: Record<
  TdrssRowType,
  TimelineEventLayout[]
> = layoutTdrssEventsByRow(tdrssEventsByRow);
