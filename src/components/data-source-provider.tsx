"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultMissionDataSourceMode,
  missionDataForMode,
  missionDataSourceStorageKey,
  type MissionDataSourceMode,
  type MissionTimelineData,
} from "@/data/data-source";

type MissionDataContextValue = {
  mode: MissionDataSourceMode;
  setMode: (mode: MissionDataSourceMode) => void;
  timelineData: MissionTimelineData;
};

const MissionDataContext = createContext<MissionDataContextValue | null>(null);

function isMissionDataSourceMode(v: string): v is MissionDataSourceMode {
  return v === "mission" || v === "demo";
}

export function MissionDataProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MissionDataSourceMode>(
    defaultMissionDataSourceMode,
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(missionDataSourceStorageKey);
    if (!raw || !isMissionDataSourceMode(raw)) return;
    setMode(raw);
  }, []);

  const updateMode = (next: MissionDataSourceMode) => {
    setMode(next);
    window.localStorage.setItem(missionDataSourceStorageKey, next);
  };

  const value = useMemo<MissionDataContextValue>(
    () => ({
      mode,
      setMode: updateMode,
      timelineData: missionDataForMode(mode),
    }),
    [mode],
  );

  return (
    <MissionDataContext.Provider value={value}>
      <div className="fixed right-3 top-3 z-[220]">
        <label className="sr-only" htmlFor="dashboard-data-source-select">
          Dashboard data source
        </label>
        <select
          id="dashboard-data-source-select"
          className="rounded border border-solid border-[#eee]/25 bg-black/70 px-2 py-1 text-xs text-[#eee] backdrop-blur-sm"
          value={mode}
          onChange={(e) => {
            const next = e.target.value;
            if (!isMissionDataSourceMode(next)) return;
            updateMode(next);
          }}
          aria-label="Dashboard data source"
          title="Dashboard data source"
        >
          <option value="mission">Mission</option>
          <option value="demo">Demo</option>
        </select>
      </div>
      {children}
    </MissionDataContext.Provider>
  );
}

export function useMissionDataSource() {
  const ctx = useContext(MissionDataContext);
  if (!ctx) {
    throw new Error("useMissionDataSource must be used within MissionDataProvider");
  }
  return ctx;
}
