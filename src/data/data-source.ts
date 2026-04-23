import demoJson from "@/data/demo.json";
import missionOperationJson from "@/data/mission-operation.json";

export type MissionDataSourceMode = "mission" | "demo";

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
  }>;
};

export const missionDataSources: Record<MissionDataSourceMode, MissionTimelineData> =
  {
    mission: missionOperationJson as MissionTimelineData,
    demo: demoJson as MissionTimelineData,
  };

export const defaultMissionDataSourceMode: MissionDataSourceMode = "mission";
export const missionDataSourceStorageKey = "dashboard-mission-data-source";

export function missionDataForMode(mode: MissionDataSourceMode): MissionTimelineData {
  return missionDataSources[mode];
}

export const apiPaths = {
  iss: "/api/iss",
} as const;

export const externalDataSources = {
  celestrakTle:
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle",
} as const;
