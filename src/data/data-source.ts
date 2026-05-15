import missionOperationJson from "@/data/mission-operation.json";
import type { TimelineEvent } from "@/lib/mission-timeline";

export type MissionTimelineData = {
  mission: {
    id: string;
    name: string;
    epoch: string;
  };
  events: TimelineEvent[];
};

export const missionTimelineData = missionOperationJson as MissionTimelineData;

export const apiPaths = {
  iss: "/api/iss",
} as const;

export const externalDataSources = {
  celestrakTle:
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle",
} as const;
