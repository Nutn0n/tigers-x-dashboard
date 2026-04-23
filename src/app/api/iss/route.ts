import { NextResponse } from "next/server";
import {
  twoline2satrec,
  propagate,
  gstime,
  jday,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js";
import type { PositionAndVelocity, SatRec } from "satellite.js";
import { externalDataSources } from "@/data/data-source";
import { groundTrackToSvgPaths } from "@/lib/iss-map-projection";

export const dynamic = "force-dynamic";

const CELESTRAK_TLE = externalDataSources.celestrakTle;

const TLE_CACHE_MS = 60 * 60 * 1000;
/** Samples per one orbital period (each span uses this × orbit count). */
const ORBIT_SAMPLES_PER_PERIOD = 512;
const ORBITS_BEHIND = 2;
const ORBITS_AHEAD = 2;
/** Fallback LEO period if mean motion is unusable (minutes). */
const FALLBACK_PERIOD_MIN = 92.68;

let tleCache: { line1: string; line2: string; fetchedAt: number } | null =
  null;

async function loadTleLines(): Promise<{ line1: string; line2: string }> {
  const now = Date.now();
  if (tleCache && now - tleCache.fetchedAt < TLE_CACHE_MS) {
    return { line1: tleCache.line1, line2: tleCache.line2 };
  }
  const res = await fetch(CELESTRAK_TLE, {
    cache: "no-store",
    headers: { Accept: "text/plain,*/*" },
  });
  if (!res.ok) {
    throw new Error(`CelesTrak HTTP ${res.status}`);
  }
  const text = await res.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const line1 = lines.find((l) => l.startsWith("1 "));
  const line2 = lines.find((l) => l.startsWith("2 "));
  if (!line1 || !line2) {
    throw new Error("TLE parse failed");
  }
  tleCache = { line1, line2, fetchedAt: now };
  return { line1, line2 };
}

function stateFromPv(pv: PositionAndVelocity, date: Date) {
  const jd = jday(date);
  const gmst = gstime(jd);
  const geo = eciToGeodetic(pv.position, gmst);
  const latitude = degreesLat(geo.latitude);
  const longitude = degreesLong(geo.longitude);
  const altitude = geo.height;
  const { x, y, z } = pv.velocity;
  const velocity = Math.sqrt(x * x + y * y + z * z);
  return { latitude, longitude, altitude, velocity };
}

function propagateState(satrec: SatRec, date: Date) {
  const pv = propagate(satrec, date);
  if (!pv) return null;
  try {
    return stateFromPv(pv, date);
  } catch {
    return null;
  }
}

function orbitPeriodMinutes(pv: PositionAndVelocity): number {
  const nm = pv.meanElements.nm;
  if (!Number.isFinite(nm) || nm <= 0) return FALLBACK_PERIOD_MIN;
  return (2 * Math.PI) / nm;
}

function sampleGroundTrackRange(
  satrec: SatRec,
  tStart: Date,
  tEnd: Date,
  steps: number,
): { lat: number; lon: number }[] {
  const t0 = tStart.getTime();
  const t1 = tEnd.getTime();
  const span = t1 - t0;
  const pts: { lat: number; lon: number }[] = [];
  const denom = Math.max(1, steps - 1);

  for (let i = 0; i < steps; i++) {
    const t = new Date(t0 + (i / denom) * span);
    const s = propagateState(satrec, t);
    if (s) pts.push({ lat: s.latitude, lon: s.longitude });
  }

  return pts;
}

export async function GET() {
  try {
    const { line1, line2 } = await loadTleLines();
    const satrec = twoline2satrec(line1, line2);
    const now = new Date();
    const pvNow = propagate(satrec, now);
    if (!pvNow) {
      return NextResponse.json(
        { error: "SGP4 propagation failed for current time" },
        { status: 502 },
      );
    }
    const { latitude, longitude, altitude, velocity } = stateFromPv(
      pvNow,
      now,
    );
    const periodMinutes = orbitPeriodMinutes(pvNow);
    const periodMs = periodMinutes * 60 * 1000;
    const pastSteps = ORBIT_SAMPLES_PER_PERIOD * ORBITS_BEHIND;
    const futureSteps = ORBIT_SAMPLES_PER_PERIOD * ORBITS_AHEAD;
    const pastPoints = sampleGroundTrackRange(
      satrec,
      new Date(now.getTime() - ORBITS_BEHIND * periodMs),
      now,
      pastSteps,
    );
    const futurePoints = sampleGroundTrackRange(
      satrec,
      now,
      new Date(now.getTime() + ORBITS_AHEAD * periodMs),
      futureSteps,
    );
    if (
      pastPoints.length < pastSteps / 4 ||
      futurePoints.length < futureSteps / 4
    ) {
      return NextResponse.json(
        { error: "Insufficient orbit samples from SGP4" },
        { status: 502 },
      );
    }
    const orbitPastPaths = groundTrackToSvgPaths(pastPoints);
    const orbitFuturePaths = groundTrackToSvgPaths(futurePoints);

    return NextResponse.json({
      latitude,
      longitude,
      altitude,
      velocity,
      orbitPastPaths,
      orbitFuturePaths,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load or compute ISS orbit" },
      { status: 502 },
    );
  }
}
