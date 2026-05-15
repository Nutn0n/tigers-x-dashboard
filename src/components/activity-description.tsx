"use client";

import { useMemo } from "react";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { useMissionTimelineEvents } from "@/hooks/use-mission-timeline-events";
import {
  DASHBOARD_ACTIVITY_DESCRIPTION_SHELL_CLASS,
  DASHBOARD_NEXT_ACTIVITY_PILL_CLASS,
  DASHBOARD_PANEL_MUTED_TEXT_CLASS,
} from "@/lib/dashboard-panel-styles";
import {
  resolveActivityDescriptionDisplay,
  timelineEventDescription,
} from "@/lib/mission-timeline";

const DESCRIPTION_BODY_CLASS =
  "m-0 text-left text-xs leading-relaxed text-[#eee]/85 sm:text-sm";

const ACTIVITY_TITLE_CLASS =
  "m-0 mb-2 text-left text-xs font-medium leading-snug text-[#eee] sm:text-sm";

const INVALID_EPOCH_MESSAGE = "Invalid mission epoch in timeline data.";
const NO_ACTIVITY_MESSAGE = "No current or upcoming activity.";

export function ActivityDescription() {
  const { epochOk, nowMs, events } = useMissionTimelineEvents();

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
      <div className={DASHBOARD_ACTIVITY_DESCRIPTION_SHELL_CLASS}>
        {!epochOk ? (
          <p className={DASHBOARD_PANEL_MUTED_TEXT_CLASS}>
            {INVALID_EPOCH_MESSAGE}
          </p>
        ) : display ? (
          <div className="w-full min-w-0">
            {display.showNextPill ? (
              <span className={DASHBOARD_NEXT_ACTIVITY_PILL_CLASS}>
                Next Activity
              </span>
            ) : null}
            <p className={ACTIVITY_TITLE_CLASS}>{display.event.name}</p>
            <p className={DESCRIPTION_BODY_CLASS}>
              {timelineEventDescription(display.event)}
            </p>
          </div>
        ) : (
          <p className={DASHBOARD_PANEL_MUTED_TEXT_CLASS}>{NO_ACTIVITY_MESSAGE}</p>
        )}
      </div>
    </TitledDashboardPanel>
  );
}
