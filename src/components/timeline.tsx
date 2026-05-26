"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FullscreenPanel } from "@/components/FullscreenPanel";
import { useMissionDataSource } from "@/components/data-source-provider";
import { formatBangkokDdMmYyHhMmSs } from "@/lib/dashboard-time";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";
import {
  BASE_PX_PER_HOUR,
  barFillBackgroundStyle,
  barLeftWidthPx,
  bucketEventsByRow,
  computeTimelineStartMs,
  computeSpanHours,
  emptyEventsByRow,
  filterLayoutsInTimeRange,
  formatOffsetFromEpoch,
  isOutlineOnlyLane,
  layoutEventsByRow,
  MS_PER_HOUR,
  MIN_TIMELINE_SPAN_HOURS,
  nowLineLeftPx,
  pxPerMsFromZoom,
  ROW_CONFIG,
  TICK_STEP_HOURS,
  TDRSS_ROW_CONFIG,
  visibleTimeRangeMs,
  type TimelineEventLayout,
  type RowType,
  type TimelineEvent,
} from "@/lib/mission-timeline";
import {
  TDRSS_TIMELINE_EVENTS,
  TDRSS_TIMELINE_LAYOUTS,
} from "@/lib/tdrss-timeline";
import { tdrssPasses } from "@/data/data-source";
import { resolveLinkPassStatus } from "@/lib/tdrss-link-pass";
import { useMissionTimelineScroll } from "@/hooks/use-mission-timeline-scroll";

const FILLED_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-black/25 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.35)]";
const FILLED_BAR_PLAIN_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded text-left";
const OUTLINE_BAR_CLASS =
  "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-solid border-white bg-transparent text-left";

const EVENT_LANE_HEIGHT_PX = 22;
const EVENT_LANE_GAP_PX = 4;
const EVENT_ROW_VERTICAL_PADDING_PX = 4;

const TDRSS_LANE_HEIGHT_PX = 8;
const TDRSS_LANE_GAP_PX = 2;
const TDRSS_ROW_VERTICAL_PADDING_PX = 2;
const TDRSS_BAR_CLASS = "absolute overflow-hidden rounded-[1px] text-left";

function rowTrackHeightPx(layouts: TimelineEventLayout[]) {
  const laneCount = layouts.length > 0 ? layouts[0].laneCount : 1;
  return (
    EVENT_ROW_VERTICAL_PADDING_PX * 2 +
    laneCount * EVENT_LANE_HEIGHT_PX +
    Math.max(0, laneCount - 1) * EVENT_LANE_GAP_PX
  );
}

function tdrssRowTrackHeightPx(layouts: TimelineEventLayout[]) {
  const laneCount = layouts.length > 0 ? layouts[0].laneCount : 1;
  return (
    TDRSS_ROW_VERTICAL_PADDING_PX * 2 +
    laneCount * TDRSS_LANE_HEIGHT_PX +
    Math.max(0, laneCount - 1) * TDRSS_LANE_GAP_PX
  );
}

type TimelineEventTooltipPayload = {
  id: string;
  title: string;
  startLabel: string;
  endLabel: string;
  startText: string;
  endText: string;
  anchor: DOMRect;
  capturedZoom: number;
};

function TimelineEventHoverTooltip({
  payload,
}: {
  payload: TimelineEventTooltipPayload;
}) {
  const { anchor, title, startLabel, endLabel, startText, endText } = payload;
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
          <dt className="m-0 shrink-0 text-[#eee]/55">{startLabel}</dt>
          <dd className="m-0 min-w-0 tabular-nums">{startText}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="m-0 shrink-0 text-[#eee]/55">{endLabel}</dt>
          <dd className="m-0 min-w-0 tabular-nums">{endText}</dd>
        </div>
      </dl>
      <p className="m-0 mt-1 text-[9px] text-[#eee]/45">Times in GMT+7 (Bangkok)</p>
    </div>
  );
}

const TimelineEventBar = memo(function TimelineEventBar({
  rowType,
  ev,
  layout,
  timelineStartMs,
  pxPerMs,
  zoom,
  onHoverChange,
}: {
  rowType: RowType;
  ev: TimelineEvent;
  layout: TimelineEventLayout;
  timelineStartMs: number;
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
    timelineStartMs,
    startMs,
    endMs,
    pxPerMs,
  );
  const outline = isOutlineOnlyLane(rowType);
  const plainFilledLane =
    rowType === "iss-event" ||
    rowType === "col-mpcc" ||
    rowType === "operation";
  const barClassName = outline
    ? OUTLINE_BAR_CLASS
    : plainFilledLane
      ? FILLED_BAR_PLAIN_CLASS
      : FILLED_BAR_CLASS;

  const barTop =
    EVENT_ROW_VERTICAL_PADDING_PX +
    layout.lane * (EVENT_LANE_HEIGHT_PX + EVENT_LANE_GAP_PX);

  return (
    <div
      className={barClassName}
      style={{
        top: barTop,
        bottom: "auto",
        height: EVENT_LANE_HEIGHT_PX,
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
          startLabel: "Start",
          endLabel: "End",
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
});

function TdrssPassBar({
  layout,
  timelineStartMs,
  pxPerMs,
  color,
}: {
  layout: TimelineEventLayout;
  timelineStartMs: number;
  pxPerMs: number;
  color: string;
}) {
  const startMs = Date.parse(layout.event.start);
  const endMs = Date.parse(layout.event.end);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return null;
  }
  const { left, width } = barLeftWidthPx(
    timelineStartMs,
    startMs,
    endMs,
    pxPerMs,
  );
  const barTop =
    TDRSS_ROW_VERTICAL_PADDING_PX +
    layout.lane * (TDRSS_LANE_HEIGHT_PX + TDRSS_LANE_GAP_PX);

  return (
    <div
      data-pass-id={layout.event.id}
      className={TDRSS_BAR_CLASS}
      style={{
        top: barTop,
        height: TDRSS_LANE_HEIGHT_PX,
        left,
        width,
        backgroundColor: color,
      }}
    />
  );
}

const TdrssTimelineRow = memo(function TdrssTimelineRow({
  allLayouts,
  visibleStartMs,
  visibleEndMs,
  timelineStartMs,
  pxPerMs,
  zoom,
  color,
  onHoverChange,
  withTopBorder = true,
}: {
  allLayouts: TimelineEventLayout[];
  visibleStartMs: number;
  visibleEndMs: number;
  timelineStartMs: number;
  pxPerMs: number;
  zoom: number;
  color: string;
  onHoverChange: (payload: TimelineEventTooltipPayload | null) => void;
  withTopBorder?: boolean;
}) {
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowHeight = tdrssRowTrackHeightPx(allLayouts);

  const visibleLayouts = useMemo(
    () => filterLayoutsInTimeRange(allLayouts, visibleStartMs, visibleEndMs),
    [allLayouts, visibleStartMs, visibleEndMs],
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showTooltipForBar = useCallback(
    (bar: HTMLElement) => {
      const passId = bar.getAttribute("data-pass-id");
      if (!passId) return;
      const layout = visibleLayouts.find((l) => l.event.id === passId);
      if (!layout) return;
      const startMs = Date.parse(layout.event.start);
      const endMs = Date.parse(layout.event.end);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;
      onHoverChange({
        id: layout.event.id,
        title: layout.event.name,
        startLabel: "AOS",
        endLabel: "LOS",
        startText: formatBangkokDdMmYyHhMmSs(new Date(startMs)),
        endText: formatBangkokDdMmYyHhMmSs(new Date(endMs)),
        anchor: bar.getBoundingClientRect(),
        capturedZoom: zoom,
      });
    },
    [visibleLayouts, zoom, onHoverChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const bar = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-pass-id]",
      );
      if (!bar) {
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => onHoverChange(null), 120);
        return;
      }
      clearHideTimer();
      showTooltipForBar(bar);
    },
    [clearHideTimer, onHoverChange, showTooltipForBar],
  );

  const handlePointerLeave = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => onHoverChange(null), 120);
  }, [clearHideTimer, onHoverChange]);

  return (
    <div
      className={`relative shrink-0 border-solid border-[#eee]/12 bg-[#050505] ${withTopBorder ? "border-t" : ""}`}
      style={{ minHeight: rowHeight }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {visibleLayouts.map((layout) => (
        <TdrssPassBar
          key={layout.event.id}
          layout={layout}
          timelineStartMs={timelineStartMs}
          pxPerMs={pxPerMs}
          color={color}
        />
      ))}
    </div>
  );
});

function TimelineNowLine({
  nowMs,
  timelineStartMs,
  pxPerMs,
}: {
  nowMs: number;
  timelineStartMs: number;
  pxPerMs: number;
}) {
  const left = nowLineLeftPx(nowMs, timelineStartMs, pxPerMs);
  if (left < 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-[8] w-px bg-white"
      style={{ left }}
      role="presentation"
      aria-label="Current time"
    />
  );
}

export function Timeline() {
  const { timelineData } = useMissionDataSource();
  const epochMs = Date.parse(timelineData.mission.epoch);
  const events = timelineData.events as TimelineEvent[];

  const [nowMs, setNowMs] = useState(() =>
    Number.isFinite(epochMs) && epochMs > 0 ? epochMs : 0,
  );
  const [eventTooltip, setEventTooltip] =
    useState<TimelineEventTooltipPayload | null>(null);
  const [viewport, setViewport] = useState({ scrollLeft: 0, width: 0 });

  const epochOk = Number.isFinite(epochMs) && epochMs > 0;

  const timelineStartMs = useMemo(
    () => (epochOk ? computeTimelineStartMs(epochMs, events) : epochMs),
    [epochOk, epochMs, events],
  );

  const spanHours = useMemo(() => {
    if (!epochOk) return MIN_TIMELINE_SPAN_HOURS;
    const missionSpan = computeSpanHours(timelineStartMs, events);
    const tdrssSpan = computeSpanHours(
      timelineStartMs,
      TDRSS_TIMELINE_EVENTS,
    );
    return Math.max(missionSpan, tdrssSpan);
  }, [epochOk, timelineStartMs, events]);

  const { eventsByRow, rowEventLayouts } = useMemo(() => {
    if (!epochOk) {
      return {
        eventsByRow: emptyEventsByRow(),
        rowEventLayouts: layoutEventsByRow(emptyEventsByRow()),
      };
    }
    const byRow = bucketEventsByRow(events);
    return {
      eventsByRow: byRow,
      rowEventLayouts: layoutEventsByRow(byRow),
    };
  }, [epochOk, events]);

  const tdrssGroupHeightPx = useMemo(
    () =>
      TDRSS_ROW_CONFIG.reduce(
        (sum, sub) =>
          sum + tdrssRowTrackHeightPx(TDRSS_TIMELINE_LAYOUTS[sub.type]),
        0,
      ),
    [],
  );

  useEffect(() => {
    setNowMs(Number.isFinite(epochMs) && epochMs > 0 ? epochMs : 0);
  }, [epochMs]);

  const {
    scrollRef,
    zoom,
    scrollToNow,
    dragPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  } = useMissionTimelineScroll(timelineStartMs, spanHours, {
    nowMs,
    enableInitialScrollToNow: epochOk,
  });

  const pxPerHour = BASE_PX_PER_HOUR * zoom;
  const pxPerMs = pxPerMsFromZoom(zoom);

  const staticTrackWidthPx = useMemo(
    () => spanHours * pxPerHour,
    [spanHours, pxPerHour],
  );

  const visibleRange = useMemo(
    () =>
      visibleTimeRangeMs(
        viewport.scrollLeft,
        viewport.width,
        timelineStartMs,
        pxPerMs,
      ),
    [viewport.scrollLeft, viewport.width, timelineStartMs, pxPerMs],
  );

  const viewportRafRef = useRef<number | null>(null);

  const syncViewport = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewport({ scrollLeft: el.scrollLeft, width: el.clientWidth });
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scheduleSync = () => {
      if (viewportRafRef.current !== null) {
        cancelAnimationFrame(viewportRafRef.current);
      }
      viewportRafRef.current = requestAnimationFrame(() => {
        viewportRafRef.current = null;
        syncViewport();
      });
    };

    scheduleSync();
    el.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);

    return () => {
      el.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      if (viewportRafRef.current !== null) {
        cancelAnimationFrame(viewportRafRef.current);
      }
    };
  }, [scrollRef, syncViewport, zoom]);

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

  const setTooltipStable = useCallback(
    (payload: TimelineEventTooltipPayload | null) => {
      setEventTooltip(payload);
    },
    [],
  );

  const linkPassStatus = useMemo(
    () => resolveLinkPassStatus(nowMs, tdrssPasses),
    [nowMs],
  );

  const aosLosBar = (
    <div className="mb-3 flex w-full items-center justify-center gap-8">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#eee]/60">S-Band</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#eee]/70">
            AOS
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: linkPassStatus.sBand.aosActive ? "#22c55e" : "#555" }}
            />
          </span>
          <span className="font-mono text-lg font-medium tabular-nums text-[#eee]">
            {linkPassStatus.sBand.aosDisplay}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#eee]/70">
            LOS
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: linkPassStatus.sBand.losActive ? "#ef4444" : "#555" }}
            />
          </span>
          <span className="font-mono text-lg font-medium tabular-nums text-[#eee]">
            {linkPassStatus.sBand.losDisplay}
          </span>
        </div>
      </div>
      <div className="h-6 w-px bg-[#eee]/20" />
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[#eee]/60">KU-Band</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#eee]/70">
            AOS
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: linkPassStatus.kuBand.aosActive ? "#22c55e" : "#555" }}
            />
          </span>
          <span className="font-mono text-lg font-medium tabular-nums text-[#eee]">
            {linkPassStatus.kuBand.aosDisplay}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#eee]/70">
            LOS
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: linkPassStatus.kuBand.losActive ? "#ef4444" : "#555" }}
            />
          </span>
          <span className="font-mono text-lg font-medium tabular-nums text-[#eee]">
            {linkPassStatus.kuBand.losDisplay}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <FullscreenPanel className="flex flex-col" renderWhenExpanded={aosLosBar}>
      {tooltipToShow &&
        typeof document !== "undefined" &&
        createPortal(
          <TimelineEventHoverTooltip payload={tooltipToShow} />,
          document.body,
        )}
      <section
        className="flex min-h-0 flex-1 flex-col rounded-[10px] border-[1px] border-solid border-[#eeeeee] px-4 pt-1 sm:px-6 md:px-10"
        aria-label="Mission timeline"
      >
        <div className="mb-1 flex items-center gap-3">
          <button
            type="button"
            className="mt-[10px] shrink-0 rounded border border-solid border-[#eee]/30 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#eee]/80 transition hover:border-[#eee]/55 hover:text-[#eee] sm:text-xs"
            onClick={scrollToNow}
            disabled={!epochOk}
          >
            Jump to now
          </button>
          <h2 className={DASHBOARD_PANEL_TITLE_CLASS}>Mission timeline</h2>
        </div>

        {!epochOk ? (
          <p className="m-0 flex-1 text-center text-sm text-[#eee]/60">
            Invalid mission epoch in timeline data.
          </p>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-y-auto pb-2 pt-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-row gap-2">
              <div
                className="flex w-[7.5rem] shrink-0 flex-col border-solid border-[#eee]/20 pr-2 pt-9 sm:w-36"
                aria-hidden
              >
                <div
                  className="flex shrink-0 flex-row"
                  style={{ minHeight: tdrssGroupHeightPx }}
                >
                  <div className="flex w-[3.25rem] shrink-0 items-center justify-center border-r border-solid border-[#eee]/15 px-1 py-1 text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-[#eee]/75 sm:w-14 sm:text-xs">
                    TDRSS
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {TDRSS_ROW_CONFIG.map((sub) => {
                      const subHeight = tdrssRowTrackHeightPx(
                        TDRSS_TIMELINE_LAYOUTS[sub.type],
                      );
                      return (
                        <div
                          key={sub.type}
                          className="flex shrink-0 items-center py-1 pl-2 text-left text-[10px] font-medium uppercase leading-tight tracking-wide text-[#eee]/75 sm:text-xs"
                          style={{
                            minHeight: subHeight,
                          }}
                        >
                          {sub.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {ROW_CONFIG.map((row) => {
                  const rowHeight = rowTrackHeightPx(rowEventLayouts[row.type]);
                  return (
                    <div
                      key={row.type}
                      className="flex shrink-0 items-center border-t border-solid border-[#eee]/15 py-1 text-left text-[10px] font-medium uppercase leading-tight tracking-wide text-[#eee]/75 sm:text-xs"
                      style={{ minHeight: rowHeight }}
                    >
                      {row.label}
                    </div>
                  );
                })}
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
                  style={{
                    width: staticTrackWidthPx,
                    minWidth: staticTrackWidthPx,
                  }}
                >
                  <div
                    className="relative min-h-[3rem] shrink-0 border-b border-solid border-[#eee]/20 bg-[#0a0a0a] py-1"
                    style={{ width: staticTrackWidthPx }}
                  >
                    {Array.from({ length: tickCount }, (_, i) => {
                      const hour = i * TICK_STEP_HOURS;
                      if (hour > spanHours) return null;
                      const left = hour * pxPerHour;
                      const tickMs = timelineStartMs + hour * MS_PER_HOUR;
                      const tickColumnWidth = Math.max(
                        1,
                        Math.min(tickStepPx, staticTrackWidthPx - left),
                      );
                      const offsetLabel = formatOffsetFromEpoch(
                        epochMs,
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
                    {TDRSS_ROW_CONFIG.map((sub, subIdx) => (
                      <TdrssTimelineRow
                        key={sub.type}
                        allLayouts={TDRSS_TIMELINE_LAYOUTS[sub.type]}
                        visibleStartMs={visibleRange.startMs}
                        visibleEndMs={visibleRange.endMs}
                        timelineStartMs={timelineStartMs}
                        pxPerMs={pxPerMs}
                        zoom={zoom}
                        color={sub.color}
                        onHoverChange={setTooltipStable}
                        withTopBorder={subIdx > 0}
                      />
                    ))}
                    {ROW_CONFIG.map((row) => {
                      const layouts = rowEventLayouts[row.type];
                      const rowHeight = rowTrackHeightPx(layouts);
                      return (
                        <div
                          key={row.type}
                          className="relative shrink-0 border-t border-solid border-[#eee]/12 bg-[#050505]"
                          style={{ minHeight: rowHeight }}
                        >
                          {layouts.map((layout) => (
                            <TimelineEventBar
                              key={layout.event.id}
                              rowType={row.type}
                              ev={layout.event}
                              layout={layout}
                              timelineStartMs={timelineStartMs}
                              pxPerMs={pxPerMs}
                              zoom={zoom}
                              onHoverChange={setTooltipStable}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  <TimelineNowLine
                    nowMs={nowMs}
                    timelineStartMs={timelineStartMs}
                    pxPerMs={pxPerMs}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </FullscreenPanel>
  );
}
