"use client";

import { useMissionDataSource } from "@/components/data-source-provider";
import { useMissionClock } from "@/hooks/use-mission-clock";
import type { TimelineEvent } from "@/lib/mission-timeline";

export function useMissionTimelineEvents() {
  const { timelineData } = useMissionDataSource();
  const { epochMs, epochOk, nowMs } = useMissionClock(timelineData.mission.epoch);
  const events = timelineData.events as TimelineEvent[];

  return { timelineData, epochMs, epochOk, nowMs, events };
}
