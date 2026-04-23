"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FullscreenPanel } from "@/components/FullscreenPanel";
import { missionEpochMs, missionTimelineEvents } from "@/data/data-source";
import { formatBangkokDdMmYyHhMmSs } from "@/lib/dashboard-time";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";
import {
  BASE_PX_PER_HOUR,
  barFillBackgroundStyle,
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

const EPOCH_MS = missionEpochMs;

const FILLED_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-black/25 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.35)]";
/** ISS + COL/MPCC: solid fill, no border or outer ring. */
const FILLED_BAR_PLAIN_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded text-left";
const OUTLINE_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-white bg-transparent text-left";

type TimelineEventTooltipPayload = {
  id: string;
  title: string;
  startText: string;
  endText: string;
  anchor: DOMRect;
  /** Hide tooltip when zoom changes without relying on effect setState. */
  capturedZoom: number;
};

function TimelineEventHoverTooltip({
  payload,
}: {
  payload: TimelineEventTooltipPayload;
}) {
  const { anchor, title, startText, endText } = payload;
  const left = anchor.left + anchor.width / 2;
  const top = anchor.top - 8;
  return (
    <div
      className="pointer-events-none fixed z-[200] max-w-[min(22rem,calc(100vw-1rem))] rounded-md border border-solid border-[#eee]/25 bg-[#000000] px-2.5 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
      style={{
        left,
        top,
        transform: "translate(-50%, -100%)",
      }}
      role="tooltip"
    >
      <p className="m-0 text-[11px] font-semibold leading-snug text-[#eee] sm:text-xs">
        {title}
      </p>
      <dl className="m-0 mt-1.5 space-y-0.5 text-[10px] leading-snug text-[#eee]/85 sm:text-[11px]">
        <div className="flex gap-2">
          <dt className="m-0 shrink-0 text-[#eee]/55">Start</dt>
          <dd className="m-0 min-w-0 tabular-nums">{startText}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="m-0 shrink-0 text-[#eee]/55">End</dt>
          <dd className="m-0 min-w-0 tabular-nums">{endText}</dd>
        </div>
      </dl>
      <p className="m-0 mt-1 text-[9px] text-[#eee]/45">Times in GMT+7 (Bangkok)</p>
    </div>
  );
}

function TimelineEventBar({
  rowType,
  ev,
  epochMs,
  pxPerMs,
  zoom,
  onHoverChange,
}: {
  rowType: RowType;
  ev: TimelineEvent;
  epochMs: number;
  pxPerMs: number;
  zoom: number;
  onHoverChange?: (payload: TimelineEventTooltipPayload | null) => void;
}) {
  const leaveHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (leaveHideTimerRef.current !== null) {
      clearTimeout(leaveHideTimerRef.current);
      leaveHideTimerRef.current = null;
    }
  };

  useEffect(() => () => clearHideTimer(), []);

  const startMs = Date.parse(ev.start);
  const endMs = Date.parse(ev.end);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return null;
  }
  const startText = formatBangkokDdMmYyHhMmSs(new Date(startMs));
  const endText = formatBangkokDdMmYyHhMmSs(new Date(endMs));
  const { left, width } = barLeftWidthPx(
    epochMs,
    startMs,
    endMs,
    pxPerMs,
  );
  const outline = isOutlineOnlyLane(rowType);
  const plainFilledLane =
    rowType === "iss-event" || rowType === "col-mpcc";
  const barClassName = outline
    ? OUTLINE_BAR_CLASS
    : plainFilledLane
      ? FILLED_BAR_PLAIN_CLASS
      : FILLED_BAR_CLASS;

  return (
    <div
      className={barClassName}
      style={{
        left,
        width,
        ...(outline
          ? { backgroundColor: "transparent" }
          : barFillBackgroundStyle(rowType)),
      }}
      aria-label={`${ev.name}. Start: ${startText}. End: ${endText}.`}
      onPointerEnter={(e) => {
        clearHideTimer();
        onHoverChange?.({
          id: ev.id,
          title: ev.name,
          startText,
          endText,
          anchor: e.currentTarget.getBoundingClientRect(),
          capturedZoom: zoom,
        });
      }}
      onPointerLeave={() => {
        clearHideTimer();
        leaveHideTimerRef.current = setTimeout(() => {
          onHoverChange?.(null);
          leaveHideTimerRef.current = null;
        }, 120);
      }}
    >
      <span className="block min-w-0 flex-1 truncate px-1.5 text-[10px] font-medium leading-tight text-[#eee] sm:text-xs">
        {ev.name}
      </span>
    </div>
  );
}

export function Timeline() {
  /** Match SSR + first client render: wall clock only after mount (avoids hydration mismatch). */
  const [nowMs, setNowMs] = useState(() =>
    Number.isFinite(EPOCH_MS) && EPOCH_MS > 0 ? EPOCH_MS : 0,
  );
  const [eventTooltip, setEventTooltip] =
    useState<TimelineEventTooltipPayload | null>(null);

  const epochOk = Number.isFinite(EPOCH_MS) && EPOCH_MS > 0;
  const events = missionTimelineEvents as TimelineEvent[];
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
  } = useMissionTimelineScroll(EPOCH_MS, spanHours, {
    nowMs,
    enableInitialScrollToNow: epochOk,
  });

  const pxPerHour = BASE_PX_PER_HOUR * zoom;
  const pxPerMs = pxPerMsFromZoom(zoom);

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

  useEffect(() => {
    if (!eventTooltip) return;
    const el = scrollRef.current;
    const hide = () => setEventTooltip(null);
    el?.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      el?.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [eventTooltip, scrollRef]);

  const tooltipToShow =
    eventTooltip && eventTooltip.capturedZoom === zoom ? eventTooltip : null;

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
      {tooltipToShow &&
        typeof document !== "undefined" &&
        createPortal(
          <TimelineEventHoverTooltip payload={tooltipToShow} />,
          document.body,
        )}
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
                className="flex w-[7.5rem] shrink-0 flex-col border-solid border-[#eee]/20 pr-2 pt-9 sm:w-36"
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
                            zoom={zoom}
                            onHoverChange={setEventTooltip}
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
