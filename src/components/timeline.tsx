import { FullscreenPanel } from "@/components/FullscreenPanel";
import timelineData from "@/data/timeline.json";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";

const ROW_CONFIG = [
  { label: "ISS Event", type: "iss-event" },
  { label: "COL/MPCC", type: "col-mpcc" },
  { label: "Chanel 1", type: "chanel-1" },
  { label: "Chamel 2", type: "chanel-2" },
  { label: "Chanel 3", type: "chanel-3" },
  { label: "Operation", type: "operation" },
] as const;

type RowType = (typeof ROW_CONFIG)[number]["type"];

type TimelineEvent = {
  id: string;
  name: string;
  type: string;
  start: string;
  end: string;
};

const PX_PER_HOUR = 72;
const TICK_STEP_HOURS = 6;
/** Minimum horizon (hours past epoch); widened if events extend further. */
const MIN_TIMELINE_SPAN_HOURS = 96;
const HOURS_PAD_AFTER_LAST_EVENT = 8;

const EPOCH_MS = Date.parse(timelineData.mission.epoch);
const MS_PER_HOUR = 3600 * 1000;
const PX_PER_MS = PX_PER_HOUR / MS_PER_HOUR;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Elapsed from epoch to `tMs`, formatted as `+ddd:hh:mm` (mission-style offset). */
function formatOffsetFromEpoch(epochMs: number, tMs: number) {
  let diffSec = Math.floor((tMs - epochMs) / 1000);
  if (diffSec < 0) diffSec = 0;
  const days = Math.floor(diffSec / 86400);
  const rem = diffSec % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  return `+${String(days).padStart(3, "0")}:${pad2(h)}:${pad2(m)}`;
}

function hoursSinceEpoch(epochMs: number, tMs: number) {
  return (tMs - epochMs) / MS_PER_HOUR;
}

function barLeftWidthPx(epochMs: number, startMs: number, endMs: number) {
  const left = (startMs - epochMs) * PX_PER_MS;
  const width = (endMs - startMs) * PX_PER_MS;
  return { left, width: Math.max(width, 6) };
}

function rowIndexForType(t: string): number | null {
  const i = ROW_CONFIG.findIndex((r) => r.type === t);
  return i >= 0 ? i : null;
}

const CHANEL_BAR_BG = "#E25C29";
const DEFAULT_BAR_BG = "#434343";

function barBackgroundForRowType(rowType: RowType): string {
  if (
    rowType === "chanel-1" ||
    rowType === "chanel-2" ||
    rowType === "chanel-3"
  ) {
    return CHANEL_BAR_BG;
  }
  return DEFAULT_BAR_BG;
}

function computeSpanHours(epochMs: number, events: TimelineEvent[]) {
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

export function Timeline() {
  const epochOk = Number.isFinite(EPOCH_MS) && EPOCH_MS > 0;
  const events = timelineData.events as TimelineEvent[];

  const spanHours = epochOk ? computeSpanHours(EPOCH_MS, events) : MIN_TIMELINE_SPAN_HOURS;
  const totalPx = spanHours * PX_PER_HOUR;
  const tickCount = Math.floor(spanHours / TICK_STEP_HOURS) + 1;

  const eventsByRow: Record<RowType, TimelineEvent[]> = {
    "iss-event": [],
    "col-mpcc": [],
    "chanel-1": [],
    "chanel-2": [],
    "chanel-3": [],
    operation: [],
  };

  if (epochOk) {
    for (const ev of events) {
      const idx = rowIndexForType(ev.type);
      if (idx === null) continue;
      const rowType = ROW_CONFIG[idx].type;
      eventsByRow[rowType].push(ev);
    }
  }

  return (
    <FullscreenPanel className="flex flex-col">
      <section
        className="flex min-h-0 flex-1 flex-col rounded-[10px] border border-solid px-4 pt-1 sm:px-6 md:px-10"
        aria-label="Mission timeline"
      >
        <h2 className={DASHBOARD_PANEL_TITLE_CLASS}>Mission timeline</h2>

        {!epochOk ? (
          <p className="m-0 flex-1 text-center text-sm text-[#eee]/60">
            Invalid mission epoch in timeline data.
          </p>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 pb-2 pt-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-row gap-2">
              <div
                className="flex w-[7.5rem] shrink-0 flex-col border-r border-solid border-[#eee]/20 pr-2 pt-7 sm:w-36"
                aria-hidden
              >
                {ROW_CONFIG.map((row) => (
                  <div
                    key={row.type}
                    className="flex min-h-0 flex-1 items-center border-t border-solid border-[#eee]/15 py-1 text-left text-[10px] font-medium uppercase leading-tight tracking-wide text-[#eee]/75 first:border-t-0 sm:text-xs"
                  >
                    {row.label}
                  </div>
                ))}
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-sm border border-solid border-[#eee]/20">
                <div
                  className="flex h-full min-h-[220px] flex-col"
                  style={{ width: totalPx, minWidth: totalPx }}
                >
                  <div
                    className="relative h-7 shrink-0 border-b border-solid border-[#eee]/20 bg-[#0a0a0a]"
                    style={{ width: totalPx }}
                  >
                    {Array.from({ length: tickCount }, (_, i) => {
                      const hour = i * TICK_STEP_HOURS;
                      if (hour > spanHours) return null;
                      const left = hour * PX_PER_HOUR;
                      const tickMs = EPOCH_MS + hour * MS_PER_HOUR;
                      return (
                        <div
                          key={hour}
                          className="absolute top-0 flex h-full flex-col justify-end border-l border-solid border-[#eee]/25 pb-0.5 pl-1"
                          style={{ left }}
                        >
                          <span className="whitespace-nowrap text-[10px] tabular-nums text-[#eee]/65 sm:text-xs">
                            {formatOffsetFromEpoch(EPOCH_MS, tickMs)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">
                    {ROW_CONFIG.map((row) => (
                      <div
                        key={row.type}
                        className="relative min-h-0 flex-1 border-t border-solid border-[#eee]/12 bg-[#050505] first:border-t-0"
                      >
                        {eventsByRow[row.type].map((ev) => {
                          const startMs = Date.parse(ev.start);
                          const endMs = Date.parse(ev.end);
                          if (
                            !Number.isFinite(startMs) ||
                            !Number.isFinite(endMs) ||
                            endMs <= startMs
                          ) {
                            return null;
                          }
                          const { left, width } = barLeftWidthPx(
                            EPOCH_MS,
                            startMs,
                            endMs,
                          );
                          return (
                            <div
                              key={ev.id}
                              className="absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-black/25 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                              style={{
                                left,
                                width,
                                backgroundColor: barBackgroundForRowType(row.type),
                              }}
                              title={ev.name}
                            >
                              <span className="block min-w-0 flex-1 truncate px-1.5 text-[10px] font-medium leading-tight text-[#eee] sm:text-xs">
                                {ev.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </FullscreenPanel>
  );
}
