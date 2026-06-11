import missionOperationJson from "@/data/mission-operation.json";
import tdrssJson from "@/data/tdrss.json";
import telemetrySnapshotJson from "@/data/telemetry-snapshot.json";
import type { TimelineEvent } from "@/lib/mission-timeline";
import type { TelemetrySnapshot } from "@/lib/telemetry";

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

export const telemetrySnapshot = telemetrySnapshotJson as TelemetrySnapshot;
