"use client";

import { useEffect, useMemo, useState } from "react";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { missionEpochMs, missionTimelineEvents } from "@/data/data-source";
import { formatHhMmSsFromDurationMs } from "@/lib/dashboard-time";
import {
  findCurrentChanelTimelineEvent,
  findCurrentStationTimelineEvent,
  findNextChanelTimelineEvent,
  findNextStationTimelineEvent,
  missionDayNumberFromEpoch,
  type TimelineEvent,
} from "@/lib/mission-timeline";

const EPOCH_MS = missionEpochMs;

const TIMER_VALUE_CLASS =
  "shrink-0 font-mono text-xl font-semibold tabular-nums leading-none tracking-tight text-[#eee] sm:text-2xl";

export function ActivityMonitor() {
  const [nowMs, setNowMs] = useState(() =>
    Number.isFinite(EPOCH_MS) && EPOCH_MS > 0 ? EPOCH_MS : 0,
  );

  const epochOk = Number.isFinite(EPOCH_MS) && EPOCH_MS > 0;
  const events = missionTimelineEvents as TimelineEvent[];

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

  const missionDay = useMemo(
    () => missionDayNumberFromEpoch(nowMs, EPOCH_MS),
    [nowMs],
  );

  return (
    <TitledDashboardPanel title="Activity Monitor" panelId="activity-monitor">
      {!epochOk ? (
        <p className="m-0 text-center text-sm text-[#eee]/60">
          Invalid mission epoch in timeline data.
        </p>
      ) : (
        <div className="flex w-full min-w-0 flex-col text-left">
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
                    ? `Time until start -${formatHhMmSsFromDurationMs(countdownMs)}`
                    : undefined
                }
              >
                {next && countdownMs != null
                  ? `-${formatHhMmSsFromDurationMs(countdownMs)}`
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
                      ? `Time until start -${formatHhMmSsFromDurationMs(stationCountdownMs)}`
                      : undefined
                }
              >
                {stationCurrent && stationElapsedMs != null
                  ? `+${formatHhMmSsFromDurationMs(stationElapsedMs)}`
                  : stationNext && stationCountdownMs != null
                    ? `-${formatHhMmSsFromDurationMs(stationCountdownMs)}`
                    : "—"}
              </span>
            </div>
          </div>
          <div className="mt-5 w-full min-w-0 border-t border-solid border-[color:var(--border)] pt-5">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-[#eee]/55 sm:text-xs">
              Mission day
            </p>
            <p
              className={`m-0 mt-1.5 w-full min-w-0 text-left ${TIMER_VALUE_CLASS}`}
              aria-label={
                missionDay != null
                  ? `Mission day ${missionDay}`
                  : "Mission day not started"
              }
            >
              {missionDay != null ? String(missionDay) : "—"}
            </p>
          </div>
        </div>
      )}
    </TitledDashboardPanel>
  );
}
