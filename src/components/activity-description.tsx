"use client";

import { useEffect, useMemo, useState } from "react";
import { useMissionDataSource } from "@/components/data-source-provider";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import {
  resolveActivityDescriptionDisplay,
  timelineEventDescription,
  type TimelineEvent,
} from "@/lib/mission-timeline";

const NEXT_ACTIVITY_PILL_CLASS =
  "mb-[10px] inline-flex w-fit shrink-0 rounded-full border border-solid border-[#eee]/35 bg-[#eee]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#eee]/90 sm:text-xs";

const DESCRIPTION_BODY_CLASS =
  "m-0 text-left text-xs leading-relaxed text-[#eee]/85 sm:text-sm";

const ACTIVITY_TITLE_CLASS =
  "m-0 mb-2 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm";

const CONTENT_SHELL_CLASS =
  "flex min-h-0 w-full min-w-0 flex-1 flex-col justify-center overflow-y-auto pr-1";

export function ActivityDescription() {
  const { timelineData } = useMissionDataSource();
  const epochMs = Date.parse(timelineData.mission.epoch);
  const events = timelineData.events as TimelineEvent[];

  const [nowMs, setNowMs] = useState(() =>
    Number.isFinite(epochMs) && epochMs > 0 ? epochMs : 0,
  );

  const epochOk = Number.isFinite(epochMs) && epochMs > 0;

  useEffect(() => {
    setNowMs(Number.isFinite(epochMs) && epochMs > 0 ? epochMs : 0);
  }, [epochMs]);

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

  const display = useMemo(
    () =>
      epochOk ? resolveActivityDescriptionDisplay(nowMs, events) : null,
    [epochOk, nowMs, events],
  );

  return (
    <TitledDashboardPanel
      title="Activity Description"
      panelId="activity-description"
    >
      <div className={CONTENT_SHELL_CLASS}>
        {!epochOk ? (
          <p className="m-0 text-center text-sm text-[#eee]/60">
            Invalid mission epoch in timeline data.
          </p>
        ) : display ? (
          <div className="w-full min-w-0">
            {display.showNextPill ? (
              <span className={NEXT_ACTIVITY_PILL_CLASS}>Next Activity</span>
            ) : null}
            <p className={ACTIVITY_TITLE_CLASS}>{display.event.name}</p>
            <p className={DESCRIPTION_BODY_CLASS}>
              {timelineEventDescription(display.event)}
            </p>
          </div>
        ) : (
          <p className="m-0 text-center text-sm text-[#eee]/60">
            No current or upcoming activity.
          </p>
        )}
      </div>
    </TitledDashboardPanel>
  );
}
