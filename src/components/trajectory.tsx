"use client";

import { useCallback, useEffect, useState } from "react";
import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import {
  latLonToMapSvg,
  MAP_SVG_HEIGHT,
  MAP_SVG_WIDTH,
} from "@/lib/iss-map-projection";

const POLL_MS = 5000;

type IssApiOk = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  periodMinutes: number;
  orbitPastPaths: string[];
  orbitFuturePaths: string[];
  timestamp: number;
};

function formatAltitudeKm(km: number) {
  return `${km.toFixed(1)} km`;
}

/** API returns velocity in km/s; show km/h for operators. */
function formatVelocityKmh(kmPerS: number) {
  return `${(kmPerS * 3600).toFixed(0)} km/h`;
}

export function Trajectory() {
  const [iss, setIss] = useState<IssApiOk | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchIss = useCallback(async () => {
    try {
      const res = await fetch("/api/iss", { cache: "no-store" });
      const data = (await res.json()) as IssApiOk & { error?: string };
      if (!res.ok || data.error) {
        setIss(null);
        setFetchError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setFetchError(null);
      setIss({
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity,
        periodMinutes: data.periodMinutes,
        orbitPastPaths: Array.isArray(data.orbitPastPaths)
          ? data.orbitPastPaths
          : [],
        orbitFuturePaths: Array.isArray(data.orbitFuturePaths)
          ? data.orbitFuturePaths
          : [],
        timestamp: data.timestamp,
      });
    } catch {
      setIss(null);
      setFetchError("Network error");
    }
  }, []);

  useEffect(() => {
    void fetchIss();
    const id = window.setInterval(() => void fetchIss(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchIss]);

  const pos =
    iss != null ? latLonToMapSvg(iss.latitude, iss.longitude) : null;

  return (
    <TitledDashboardPanel
      title="Trajectory"
      panelId="trajectory"
      contentFlush
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative grid min-h-0 w-full flex-1 place-items-center overflow-hidden">
          <img
            src="/map.svg"
            alt="Trajectory map"
            className="col-start-1 row-start-1 max-h-full max-w-full object-contain object-center"
          />
          <svg
            className="pointer-events-none col-start-1 row-start-1 h-full w-full max-h-full max-w-full"
            viewBox={`0 0 ${MAP_SVG_WIDTH} ${MAP_SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {iss != null && !fetchError
              ? iss.orbitPastPaths.map((d, i) => (
                  <path
                    key={`p-${i}`}
                    d={d}
                    fill="none"
                    stroke="#5e5e5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))
              : null}
            {iss != null && !fetchError
              ? iss.orbitFuturePaths.map((d, i) => (
                  <path
                    key={`f-${i}`}
                    d={d}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))
              : null}
            {iss != null && pos ? (
              <circle cx={pos.x} cy={pos.y} r="10" fill="#ffffff">
                <title>
                  ISS {iss.latitude.toFixed(2)}°, {iss.longitude.toFixed(2)}°
                </title>
              </circle>
            ) : null}
          </svg>
        </div>

        <div
          className="shrink-0 border-t border-solid border-[#eee]/15 px-3 py-2 text-center"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm">
            <span className="text-[#eee]/60">
              Altitude{" "}
              <span className="font-mono tabular-nums text-[#eee]">
                {iss != null && !fetchError
                  ? formatAltitudeKm(iss.altitude)
                  : "—"}
              </span>
            </span>
            <span className="text-[#eee]/60">
              Velocity{" "}
              <span className="font-mono tabular-nums text-[#eee]">
                {iss != null && !fetchError
                  ? formatVelocityKmh(iss.velocity)
                  : "—"}
              </span>
            </span>
          </div>
          {fetchError ? (
            <p className="m-0 mt-1 text-[10px] text-[#eee]/45">{fetchError}</p>
          ) : null}
        </div>
      </div>
    </TitledDashboardPanel>
  );
}
