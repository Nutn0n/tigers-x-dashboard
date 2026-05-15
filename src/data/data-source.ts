import missionOperationJson from "@/data/mission-operation.json";

export type MissionTimelineData = {
  mission: {
    id: string;
    name: string;
    epoch: string;
  };
  events: Array<{
    id?: string;
    name?: string;
    type?: string;
    start?: string;
    end?: string;
    description?: string;
  }>;
};

export const missionTimelineData = missionOperationJson as MissionTimelineData;

export const apiPaths = {
  iss: "/api/iss",
} as const;

export const externalDataSources = {
  celestrakTle:
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle",
} as const;
