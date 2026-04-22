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
import { groundTrackToSvgPaths } from "@/lib/iss-map-projection";

export const dynamic = "force-dynamic";

const CELESTRAK_TLE =
  "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle";

const TLE_CACHE_MS = 60 * 60 * 1000;
const ORBIT_SAMPLES = 512;
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

function sampleGroundTrack(
  satrec: SatRec,
  start: Date,
  periodMin: number,
): { lat: number; lon: number }[] {
  const periodMs = periodMin * 60 * 1000;
  const pts: { lat: number; lon: number }[] = [];
  const t0 = start.getTime();

  for (let i = 0; i < ORBIT_SAMPLES; i++) {
    const t = new Date(t0 + (i / ORBIT_SAMPLES) * periodMs);
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
    const groundPoints = sampleGroundTrack(satrec, now, periodMinutes);
    if (groundPoints.length < ORBIT_SAMPLES / 4) {
      return NextResponse.json(
        { error: "Insufficient orbit samples from SGP4" },
        { status: 502 },
      );
    }
    const orbitPaths = groundTrackToSvgPaths(groundPoints);

    return NextResponse.json({
      latitude,
      longitude,
      altitude,
      velocity,
      periodMinutes,
      orbitPaths,
      timestamp: Math.floor(now.getTime() / 1000),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load or compute ISS orbit" },
      { status: 502 },
    );
  }
}
