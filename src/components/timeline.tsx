"use client";

import { useEffect, useState } from "react";
import { FullscreenPanel } from "@/components/FullscreenPanel";
import timelineData from "@/data/timeline.json";
import { formatBangkokDdMmYyHhMmSs } from "@/lib/dashboard-time";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";
import {
  BASE_PX_PER_HOUR,
  barFillForRowType,
  barLeftWidthPx,
  bucketEventsByRow,
  computeSpanHours,
  emptyEventsByRow,
  formatOffsetFromEpoch,
  isOutlineOnlyLane,
  MS_PER_HOUR,
  MIN_TIMELINE_SPAN_HOURS,
  nowLineLeftPx,
  pxPerMsFromZoom,
  ROW_CONFIG,
  TICK_STEP_HOURS,
  timelineTrackWidthPx,
  type RowType,
  type TimelineEvent,
} from "@/lib/mission-timeline";
import { useMissionTimelineScroll } from "@/hooks/use-mission-timeline-scroll";

const EPOCH_MS = Date.parse(timelineData.mission.epoch);

const FILLED_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-black/25 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.35)]";
const OUTLINE_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-white bg-transparent text-left";

function TimelineEventBar({
  rowType,
  ev,
  epochMs,
  pxPerMs,
}: {
  rowType: RowType;
  ev: TimelineEvent;
  epochMs: number;
  pxPerMs: number;
}) {
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
    epochMs,
    startMs,
    endMs,
    pxPerMs,
  );
  const outline = isOutlineOnlyLane(rowType);
  return (
    <div
      className={outline ? OUTLINE_BAR_CLASS : FILLED_BAR_CLASS}
      style={{
        left,
        width,
        ...(outline
          ? { backgroundColor: "transparent" }
          : { backgroundColor: barFillForRowType(rowType) }),
      }}
      title={ev.name}
    >
      <span className="block min-w-0 flex-1 truncate px-1.5 text-[10px] font-medium leading-tight text-[#eee] sm:text-xs">
        {ev.name}
      </span>
    </div>
  );
}

export function Timeline() {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const epochOk = Number.isFinite(EPOCH_MS) && EPOCH_MS > 0;
  const events = timelineData.events as TimelineEvent[];
  const spanHours = epochOk
    ? computeSpanHours(EPOCH_MS, events)
    : MIN_TIMELINE_SPAN_HOURS;

  const {
    scrollRef,
    zoom,
    dragPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  } = useMissionTimelineScroll(EPOCH_MS, spanHours);

  const pxPerHour = BASE_PX_PER_HOUR * zoom;
  const pxPerMs = pxPerMsFromZoom(zoom);

  useEffect(() => {
    if (!epochOk) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [epochOk]);

  const tickStepPx = TICK_STEP_HOURS * pxPerHour;
  const tickCount = Math.floor(spanHours / TICK_STEP_HOURS) + 1;
  const eventsByRow = epochOk
    ? bucketEventsByRow(events)
    : emptyEventsByRow();
  const trackWidthPx = timelineTrackWidthPx({
    spanHours,
    pxPerHour,
    nowMs,
    epochMs: EPOCH_MS,
    pxPerMs,
  });
  const nowLeftPx = nowLineLeftPx(nowMs, EPOCH_MS, pxPerMs);

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
                className="flex w-[7.5rem] shrink-0 flex-col border-r border-solid border-[#eee]/20 pr-2 pt-9 sm:w-36"
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
                className={`min-h-0 min-w-0 flex-1 select-none overflow-x-auto overflow-y-hidden rounded-sm border border-solid border-[#eee]/20 ${
                  dragPan ? "cursor-grabbing" : "cursor-grab"
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onLostPointerCapture={onLostPointerCapture}
              >
                <span className="sr-only">
                  Drag horizontally to pan the timeline. Vertical scroll wheel zooms.
                  Shift-scroll or horizontal wheel also pans.
                </span>
                <div
                  className="relative flex h-full min-h-[220px] cursor-inherit flex-col"
                  style={{ width: trackWidthPx, minWidth: trackWidthPx }}
                >
                  <div
                    className="relative min-h-[3rem] shrink-0 border-b border-solid border-[#eee]/20 bg-[#0a0a0a] py-1"
                    style={{ width: trackWidthPx }}
                  >
                    {Array.from({ length: tickCount }, (_, i) => {
                      const hour = i * TICK_STEP_HOURS;
                      if (hour > spanHours) return null;
                      const left = hour * pxPerHour;
                      const tickMs = EPOCH_MS + hour * MS_PER_HOUR;
                      const tickColumnWidth = Math.max(
                        1,
                        Math.min(tickStepPx, trackWidthPx - left),
                      );
                      const offsetLabel = formatOffsetFromEpoch(
                        EPOCH_MS,
                        tickMs,
                      );
                      const bangkokLabel = formatBangkokDdMmYyHhMmSs(
                        new Date(tickMs),
                      );
                      return (
                        <div
                          key={hour}
                          className="absolute bottom-0 top-0 box-border flex flex-col justify-end border-l border-solid border-[#eee]/25 py-0.5 pl-1 pr-0.5"
                          style={{ left, width: tickColumnWidth }}
                        >
                          <span className="w-full text-[9px] tabular-nums leading-snug text-[#eee]/65 break-words [overflow-wrap:anywhere] sm:text-[10px] md:text-xs">
                            {offsetLabel}{" "}
                            <span
                              className="text-[#eee]/55"
                              title="Local civil time in Indochina Time (ICT, UTC+7)"
                            >
                              (GMT+7: {bangkokLabel})
                            </span>
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
                        {eventsByRow[row.type].map((ev) => (
                          <TimelineEventBar
                            key={ev.id}
                            rowType={row.type}
                            ev={ev}
                            epochMs={EPOCH_MS}
                            pxPerMs={pxPerMs}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {nowLeftPx >= 0 && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-[8] w-px bg-white"
                      style={{ left: nowLeftPx }}
                      role="presentation"
                      aria-label="Current time"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </FullscreenPanel>
  );
}
