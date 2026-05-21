import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import seedTle from "@/data/iss-tle.json";
import { externalDataSources } from "@/data/data-source";

export type IssTleRecord = {
  name: string;
  noradId: number;
  line1: string;
  line2: string;
  updatedAt: string;
  source: string;
};

const TLE_REFRESH_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;
const RUNTIME_DIR = path.join(process.cwd(), "data");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "iss-tle.json");

let memoryCache: IssTleRecord | null = null;
let refreshInFlight: Promise<void> | null = null;

function parseTleText(text: string): { line1: string; line2: string } | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const line1 = lines.find((l) => l.startsWith("1 "));
  const line2 = lines.find((l) => l.startsWith("2 "));
  if (!line1 || !line2) return null;
  return { line1, line2 };
}

async function readRuntimeFile(): Promise<IssTleRecord | null> {
  try {
    const raw = await readFile(RUNTIME_FILE, "utf8");
    return JSON.parse(raw) as IssTleRecord;
  } catch {
    return null;
  }
}

async function writeRuntimeFile(record: IssTleRecord): Promise<void> {
  await mkdir(RUNTIME_DIR, { recursive: true });
  await writeFile(RUNTIME_FILE, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

function seedRecord(): IssTleRecord {
  return seedTle as IssTleRecord;
}

function isStale(record: IssTleRecord): boolean {
  const updated = Date.parse(record.updatedAt);
  if (!Number.isFinite(updated)) return true;
  return Date.now() - updated >= TLE_REFRESH_MS;
}

async function fetchFromCelesTrak(): Promise<IssTleRecord | null> {
  const res = await fetch(externalDataSources.celestrakTle, {
    cache: "no-store",
    headers: { Accept: "text/plain,*/*" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const parsed = parseTleText(await res.text());
  if (!parsed) return null;
  return {
    name: seedRecord().name,
    noradId: seedRecord().noradId,
    line1: parsed.line1,
    line2: parsed.line2,
    updatedAt: new Date().toISOString(),
    source: "celestrak",
  };
}

async function refreshIfStale(): Promise<void> {
  const current = memoryCache ?? (await readRuntimeFile()) ?? seedRecord();
  if (!isStale(current)) return;

  try {
    const fresh = await fetchFromCelesTrak();
    if (!fresh) return;
    memoryCache = fresh;
    await writeRuntimeFile(fresh);
  } catch {
    // Keep serving stored TLE when CelesTrak is unreachable.
  }
}

function scheduleRefreshIfStale(): void {
  if (refreshInFlight) return;
  refreshInFlight = refreshIfStale().finally(() => {
    refreshInFlight = null;
  });
}

/** Returns persisted TLE immediately; attempts a daily CelesTrak refresh in the background. */
export async function getIssTleLines(): Promise<{
  line1: string;
  line2: string;
}> {
  if (!memoryCache) {
    memoryCache = (await readRuntimeFile()) ?? seedRecord();
  }

  scheduleRefreshIfStale();

  return { line1: memoryCache.line1, line2: memoryCache.line2 };
}
