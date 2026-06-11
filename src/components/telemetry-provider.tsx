"use client";

import { telemetrySnapshot } from "@/data/data-source";
import type { TelemetrySnapshot } from "@/lib/telemetry";
import { createContext, useContext, type ReactNode } from "react";

type TelemetryContextValue = {
  snapshot: TelemetrySnapshot;
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  return (
    <TelemetryContext.Provider value={{ snapshot: telemetrySnapshot }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetry must be used within TelemetryProvider");
  }
  return ctx;
}
