"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  BASE_PX_PER_HOUR,
  pxPerMsFromZoom,
  timelineTrackWidthPx,
} from "@/lib/mission-timeline";

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 10;
const ZOOM_STEP = 1.12;

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

export type MissionTimelineScrollOptions = {
  nowMs: number;
  /** After the client clock replaces the SSR placeholder, scroll once so "now" is near the viewport center. */
  enableInitialScrollToNow?: boolean;
};

export function useMissionTimelineScroll(
  epochMs: number,
  spanHours: number,
  { nowMs, enableInitialScrollToNow = false }: MissionTimelineScrollOptions,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const wheelProbeRef = useRef<{
    focalMs: number;
    z0: number;
    z1: number;
  } | null>(null);
  const initialScrollDoneRef = useRef(false);

  const [dragPan, setDragPan] = useState(false);
  const dragRef = useRef<{
    startClientX: number;
    startScrollLeft: number;
    pointerId: number;
  } | null>(null);

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
        epochMs + (el.scrollLeft + el.clientWidth / 2) / pxPerMs0;

      wheelProbeRef.current = { focalMs, z0, z1 };
      setZoom(z1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [epochMs]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const probe = wheelProbeRef.current;

    const pxPerHour = BASE_PX_PER_HOUR * zoom;
    const pxPerMs = pxPerMsFromZoom(zoom);
    const trackWidthPx = timelineTrackWidthPx({
      spanHours,
      pxPerHour,
      nowMs,
      epochMs,
      pxPerMs,
    });

    if (el && probe && Math.abs(probe.z1 - zoom) <= 1e-6) {
      const pxPerMs1 = pxPerMsFromZoom(zoom);
      const maxScrollLeft = Math.max(0, trackWidthPx - el.clientWidth);
      const nextScrollLeft =
        (probe.focalMs - epochMs) * pxPerMs1 - el.clientWidth / 2;
      el.scrollLeft = Math.max(
        0,
        Math.min(nextScrollLeft, maxScrollLeft),
      );

      wheelProbeRef.current = null;
    }

    zoomRef.current = zoom;
  }, [zoom, spanHours, epochMs, nowMs]);

  useLayoutEffect(() => {
    if (!enableInitialScrollToNow || initialScrollDoneRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    if (nowMs === epochMs) return;

    const pxPerHour = BASE_PX_PER_HOUR * zoom;
    const pxPerMs = pxPerMsFromZoom(zoom);
    const trackWidthPx = timelineTrackWidthPx({
      spanHours,
      pxPerHour,
      nowMs,
      epochMs,
      pxPerMs,
    });
    const maxScrollLeft = Math.max(0, trackWidthPx - el.clientWidth);
    const nextScrollLeft =
      (nowMs - epochMs) * pxPerMs - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, Math.min(nextScrollLeft, maxScrollLeft));
    initialScrollDoneRef.current = true;
  }, [
    enableInitialScrollToNow,
    nowMs,
    epochMs,
    spanHours,
    zoom,
  ]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startClientX: e.clientX,
      startScrollLeft: el.scrollLeft,
      pointerId: e.pointerId,
    };
    setDragPan(true);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !el) return;
    const dx = e.clientX - drag.startClientX;
    el.scrollLeft = drag.startScrollLeft - dx;
  }, []);

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragPan(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be released */
    }
  }, []);

  const onPointerUp = endDrag;
  const onPointerCancel = endDrag;

  const onLostPointerCapture = useCallback(() => {
    dragRef.current = null;
    setDragPan(false);
  }, []);

  return {
    scrollRef,
    zoom,
    dragPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  };
}
