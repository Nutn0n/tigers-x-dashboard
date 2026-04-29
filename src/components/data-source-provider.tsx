"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { missionTimelineData, type MissionTimelineData } from "@/data/data-source";

type MissionDataContextValue = {
  timelineData: MissionTimelineData;
};

const MissionDataContext = createContext<MissionDataContextValue | null>(null);

export function MissionDataProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MissionDataContextValue>(
    () => ({
      timelineData: missionTimelineData,
    }),
    [],
  );

  return (
    <MissionDataContext.Provider value={value}>{children}</MissionDataContext.Provider>
  );
}

export function useMissionDataSource() {
  const ctx = useContext(MissionDataContext);
  if (!ctx) {
    throw new Error("useMissionDataSource must be used within MissionDataProvider");
  }
  return ctx;
}
