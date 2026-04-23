import timelineJson from "@/data/mission-operation.json";

export const missionTimelineData = timelineJson;
export const missionEpochIso = timelineJson.mission.epoch;
export const missionEpochMs = Date.parse(missionEpochIso);
export const missionTimelineEvents = timelineJson.events;

export const apiPaths = {
  iss: "/api/iss",
} as const;

export const externalDataSources = {
  celestrakTle:
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle",
} as const;
