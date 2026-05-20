import missionOperationJson from "@/data/mission-operation.json";
import tdrssJson from "@/data/tdrss.json";
import type { TimelineEvent } from "@/lib/mission-timeline";

export type TdrssPass = {
  band: "s" | "ku";
  start: string;
  end: string;
};

export type MissionTimelineData = {
  mission: {
    id: string;
    name: string;
    epoch: string;
  };
  events: TimelineEvent[];
};

export const missionTimelineData = missionOperationJson as MissionTimelineData;

export const tdrssPasses = tdrssJson as TdrssPass[];

export const apiPaths = {
  iss: "/api/iss",
  telemetryHealth: "/api/telemetry/health",
  telemetryLatest: "/api/telemetry/latest",
  telemetryStream: "/api/telemetry/stream",
} as const;

export const externalDataSources = {
  celestrakTle:
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle",
} as const;
