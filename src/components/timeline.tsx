"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const BASE_PX_PER_HOUR = 72;
const TICK_STEP_HOURS = 6;
const MIN_TIMELINE_SPAN_HOURS = 96;
const HOURS_PAD_AFTER_LAST_EVENT = 8;

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 10;
const ZOOM_STEP = 1.12;

const EPOCH_MS = Date.parse(timelineData.mission.epoch);
const MS_PER_HOUR = 3600 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

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

function pxPerMsFromZoom(zoom: number) {
  return (BASE_PX_PER_HOUR * zoom) / MS_PER_HOUR;
}

function barLeftWidthPx(
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

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

export function Timeline() {
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wheelProbeRef = useRef<{
    focalMs: number;
    z0: number;
    z1: number;
  } | null>(null);

  const epochOk = Number.isFinite(EPOCH_MS) && EPOCH_MS > 0;
  const events = timelineData.events as TimelineEvent[];
  const spanHours = epochOk
    ? computeSpanHours(EPOCH_MS, events)
    : MIN_TIMELINE_SPAN_HOURS;

  const pxPerHour = BASE_PX_PER_HOUR * zoom;
  const pxPerMs = pxPerMsFromZoom(zoom);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const panHorizontal =
        e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (panHorizontal) {
        return;
      }

      e.preventDefault();
      const z0 = zoomRef.current;
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      const z1 = clampZoom(z0 * factor);
      if (z1 === z0) {
        wheelProbeRef.current = null;
        return;
      }
      const pxPerMs0 = pxPerMsFromZoom(z0);
      const focalMs =
        EPOCH_MS +
        (el.scrollLeft + el.clientWidth / 2) / pxPerMs0;

      wheelProbeRef.current = { focalMs, z0, z1 };
      setZoom(z1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const probe = wheelProbeRef.current;

    if (el && probe && Math.abs(probe.z1 - zoom) <= 1e-6) {
      const pxPerMs1 = pxPerMsFromZoom(zoom);
      const contentWidthPx = spanHours * BASE_PX_PER_HOUR * zoom;
      const maxScrollLeft = Math.max(0, contentWidthPx - el.clientWidth);
      const nextScrollLeft =
        (probe.focalMs - EPOCH_MS) * pxPerMs1 - el.clientWidth / 2;
      el.scrollLeft = Math.max(
        0,
        Math.min(nextScrollLeft, maxScrollLeft),
      );

      wheelProbeRef.current = null;
    }

    zoomRef.current = zoom;
  }, [zoom, spanHours]);

  const totalPx = spanHours * pxPerHour;
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

              <div
                ref={scrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-sm border border-solid border-[#eee]/20"
              >
                <span className="sr-only">
                  Vertical scroll wheel zooms the timeline. Shift-scroll or horizontal
                  scroll pans sideways.
                </span>
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
                      const left = hour * pxPerHour;
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
                            pxPerMs,
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
