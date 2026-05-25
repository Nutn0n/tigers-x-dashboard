"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { useMissionTimelineEvents } from "@/hooks/use-mission-timeline-events";
import { apiPaths } from "@/data/data-source";
import { withBasePath } from "@/lib/app-path";
import {
  latLonToMapSvg,
  MAP_SVG_HEIGHT,
  MAP_SVG_WIDTH,
} from "@/lib/iss-map-projection";
import {
  DASHBOARD_NEXT_ACTIVITY_PILL_CLASS,
  DASHBOARD_PANEL_MUTED_TEXT_CLASS,
} from "@/lib/dashboard-panel-styles";
import {
  formatHhMmSsCountdownRemainingMs,
  formatHhMmSsFromDurationMs,
} from "@/lib/dashboard-time";
import {
  findCurrentChanelTimelineEvent,
  findCurrentStationTimelineEvent,
  findNextChanelTimelineEvent,
  findNextStationTimelineEvent,
  resolveActivityDescriptionDisplay,
  timelineEventDescription,
} from "@/lib/mission-timeline";

const TIMER_VALUE_CLASS =
  "shrink-0 font-mono text-xl font-semibold tabular-nums leading-none tracking-tight text-[#eee] sm:text-2xl";

const DESCRIPTION_BODY_CLASS =
  "m-0 text-left text-xs leading-relaxed text-[#eee]/85 sm:text-sm";

const ACTIVITY_TITLE_CLASS =
  "m-0 mb-2 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm";

const NO_ACTIVITY_MESSAGE = "No current or upcoming activity.";

const POLL_MS = 5000;

type IssApiOk = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  orbitPastPaths: string[];
  orbitFuturePaths: string[];
};

function formatAltitudeKm(km: number) {
  return `${km.toFixed(1)} km`;
}

function formatVelocityKmh(kmPerS: number) {
  return `${(kmPerS * 3600).toFixed(0)} km/h`;
}

export function ActivityMonitor() {
  const { epochOk, nowMs, events } = useMissionTimelineEvents();

  const [iss, setIss] = useState<IssApiOk | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchIss = useCallback(async () => {
    try {
      const res = await fetch(withBasePath(apiPaths.iss), { cache: "no-store" });
      const data = (await res.json()) as IssApiOk & { error?: string };
      if (!res.ok || data.error) {
        setIss(null);
        setFetchError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setFetchError(null);
      setIss({
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity,
        orbitPastPaths: Array.isArray(data.orbitPastPaths)
          ? data.orbitPastPaths
          : [],
        orbitFuturePaths: Array.isArray(data.orbitFuturePaths)
          ? data.orbitFuturePaths
          : [],
      });
    } catch {
      setIss(null);
      setFetchError("Network error");
    }
  }, []);

  useEffect(() => {
    void fetchIss();
    const id = window.setInterval(() => void fetchIss(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchIss]);

  const pos =
    iss != null ? latLonToMapSvg(iss.latitude, iss.longitude) : null;

  const descriptionDisplay = useMemo(
    () =>
      epochOk ? resolveActivityDescriptionDisplay(nowMs, events) : null,
    [epochOk, nowMs, events],
  );

  const current = epochOk
    ? findCurrentChanelTimelineEvent(nowMs, events)
    : null;
  const next = epochOk ? findNextChanelTimelineEvent(nowMs, events) : null;

  const elapsedMs = useMemo(() => {
    if (!current) return null;
    const startMs = Date.parse(current.start);
    if (!Number.isFinite(startMs)) return null;
    return nowMs - startMs;
  }, [current, nowMs]);

  const countdownMs = useMemo(() => {
    if (!next) return null;
    const startMs = Date.parse(next.start);
    if (!Number.isFinite(startMs)) return null;
    return startMs - nowMs;
  }, [next, nowMs]);

  const stationCurrent = epochOk
    ? findCurrentStationTimelineEvent(nowMs, events)
    : null;
  const stationNext = epochOk
    ? findNextStationTimelineEvent(nowMs, events)
    : null;

  const stationElapsedMs = useMemo(() => {
    if (!stationCurrent) return null;
    const startMs = Date.parse(stationCurrent.start);
    if (!Number.isFinite(startMs)) return null;
    return nowMs - startMs;
  }, [stationCurrent, nowMs]);

  const stationCountdownMs = useMemo(() => {
    if (!stationNext) return null;
    const startMs = Date.parse(stationNext.start);
    if (!Number.isFinite(startMs)) return null;
    return startMs - nowMs;
  }, [stationNext, nowMs]);

  return (
    <TitledDashboardPanel title="Activity Monitor" panelId="activity-monitor" contentFlush>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="relative grid min-h-0 w-full shrink-0 place-items-center overflow-hidden" style={{ minHeight: 180 }}>
          <img
            src={withBasePath("/map.svg")}
            alt="Trajectory map"
            className="col-start-1 row-start-1 max-h-full max-w-full object-contain object-center"
          />
          <svg
            className="pointer-events-none col-start-1 row-start-1 h-full w-full max-h-full max-w-full"
            viewBox={`0 0 ${MAP_SVG_WIDTH} ${MAP_SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {iss != null && !fetchError
              ? iss.orbitPastPaths.map((d, i) => (
                  <path
                    key={`p-${i}`}
                    d={d}
                    fill="none"
                    stroke="#5e5e5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))
              : null}
            {iss != null && !fetchError
              ? iss.orbitFuturePaths.map((d, i) => (
                  <path
                    key={`f-${i}`}
                    d={d}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))
              : null}
            {iss != null && pos ? (
              <circle cx={pos.x} cy={pos.y} r="10" fill="#ffffff">
                <title>
                  ISS {iss.latitude.toFixed(2)}°, {iss.longitude.toFixed(2)}°
                </title>
              </circle>
            ) : null}
          </svg>
        </div>

        <div
          className="shrink-0 border-t border-solid border-[#eee]/15 px-3 py-2 text-center"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm">
            <span className="text-[#eee]/60">
              Altitude{" "}
              <span className="font-mono tabular-nums text-[#eee]">
                {iss != null && !fetchError
                  ? formatAltitudeKm(iss.altitude)
                  : "—"}
              </span>
            </span>
            <span className="text-[#eee]/60">
              Velocity{" "}
              <span className="font-mono tabular-nums text-[#eee]">
                {iss != null && !fetchError
                  ? formatVelocityKmh(iss.velocity)
                  : "—"}
              </span>
            </span>
          </div>
          {fetchError ? (
            <p className="m-0 mt-1 text-[10px] text-[#eee]/45">{fetchError}</p>
          ) : null}
        </div>

      {!epochOk ? (
        <p className={`${DASHBOARD_PANEL_MUTED_TEXT_CLASS} px-4`}>
          Invalid mission epoch in timeline data.
        </p>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto text-left px-4 pb-4 pr-3">
          <div className="w-full min-w-0">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
              Current activity
            </p>
            <div className="mt-1.5 flex min-w-0 flex-row items-end justify-between gap-3">
              <p className="m-0 min-w-0 flex-1 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm">
                {current?.name ?? "Idle"}
              </p>
              <span
                className={TIMER_VALUE_CLASS}
                aria-label={
                  current && elapsedMs != null
                    ? `Elapsed ${formatHhMmSsFromDurationMs(elapsedMs)}`
                    : "Idle, no elapsed channel activity"
                }
              >
                {current && elapsedMs != null
                  ? formatHhMmSsFromDurationMs(elapsedMs)
                  : "--:--:--"}
              </span>
            </div>
          </div>
          <div className="mt-5 w-full min-w-0 border-t border-solid border-[color:var(--border)] pt-5">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
              Next activity
            </p>
            <div className="mt-1.5 flex min-w-0 flex-row items-end justify-between gap-3">
              <p className="m-0 min-w-0 flex-1 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm">
                {next?.name ?? "No upcoming activity"}
              </p>
              <span
                className={TIMER_VALUE_CLASS}
                aria-label={
                  next && countdownMs != null
                    ? `Time until start ${formatHhMmSsCountdownRemainingMs(countdownMs)}`
                    : undefined
                }
              >
                {next && countdownMs != null
                  ? formatHhMmSsCountdownRemainingMs(countdownMs)
                  : "—"}
              </span>
            </div>
          </div>
          <div className="mt-5 w-full min-w-0 border-t border-solid border-[color:var(--border)] pt-5">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
              Station activity
            </p>
            <div className="mt-1.5 flex min-w-0 flex-row items-end justify-between gap-3">
              <p className="m-0 min-w-0 flex-1 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm">
                {stationCurrent
                  ? stationCurrent.name
                  : (stationNext?.name ?? "No upcoming station activity")}
              </p>
              <span
                className={TIMER_VALUE_CLASS}
                aria-label={
                  stationCurrent && stationElapsedMs != null
                    ? `Elapsed +${formatHhMmSsFromDurationMs(stationElapsedMs)}`
                    : stationNext && stationCountdownMs != null
                      ? `Time until start ${formatHhMmSsCountdownRemainingMs(stationCountdownMs)}`
                      : undefined
                }
              >
                {stationCurrent && stationElapsedMs != null
                  ? `+${formatHhMmSsFromDurationMs(stationElapsedMs)}`
                  : stationNext && stationCountdownMs != null
                    ? formatHhMmSsCountdownRemainingMs(stationCountdownMs)
                    : "—"}
              </span>
            </div>
          </div>
          <div className="mt-5 w-full min-w-0 border-t border-solid border-[color:var(--border)] pt-5">
            {descriptionDisplay ? (
              <div className="w-full min-w-0">
                {descriptionDisplay.showNextPill ? (
                  <span className={DASHBOARD_NEXT_ACTIVITY_PILL_CLASS}>
                    Next Activity
                  </span>
                ) : null}
                <p className={ACTIVITY_TITLE_CLASS}>
                  {descriptionDisplay.event.name}
                </p>
                <p className={DESCRIPTION_BODY_CLASS}>
                  {timelineEventDescription(descriptionDisplay.event)}
                </p>
              </div>
            ) : (
              <p className={DASHBOARD_PANEL_MUTED_TEXT_CLASS}>
                {NO_ACTIVITY_MESSAGE}
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </TitledDashboardPanel>
  );
}
