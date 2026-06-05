import { missionTimelineData } from "@/data/data-source";

export const CUBE_DEACTIVATION_EVENT_ID = "cube-deactivation";

export function getCubeDeactivationTargetMs(): number {
  const event = missionTimelineData.events.find(
    (e) => e.id === CUBE_DEACTIVATION_EVENT_ID,
  );
  if (!event) return NaN;
  return Date.parse(event.start);
}

export function getCubeDeactivationLabel(): string {
  const event = missionTimelineData.events.find(
    (e) => e.id === CUBE_DEACTIVATION_EVENT_ID,
  );
  return event?.name ?? "Experiment Cube Deactivation";
}
