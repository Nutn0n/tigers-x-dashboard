"use client";

import { useMemo } from "react";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { useMissionTimelineEvents } from "@/hooks/use-mission-timeline-events";
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

export function ActivityMonitor() {
  const { epochOk, nowMs, events } = useMissionTimelineEvents();

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
    <TitledDashboardPanel title="Activity Monitor" panelId="activity-monitor">
      {!epochOk ? (
        <p className={DASHBOARD_PANEL_MUTED_TEXT_CLASS}>
          Invalid mission epoch in timeline data.
        </p>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto text-left pr-1">
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
    </TitledDashboardPanel>
  );
}
