#!/usr/bin/env node
/**
 * Merge TDRSS pass windows from a DOY/HH:MM:SS CSV into src/data/tdrss.json.
 *
 * Modes:
 *   Window splice (default): replace passes overlapping DOY 149–153 (May 29 – Jun 2 UTC)
 *   Tail splice: --from-cutoff ISO — keep passes before cutoff, replace from cutoff onward
 *
 * Usage:
 *   node scripts/merge-tdrss-from-csv.mjs [csvPath] [--dry-run]
 *   node scripts/merge-tdrss-from-csv.mjs scripts/data/tdrss-doy152-plus.csv --from-cutoff 2026-06-01T00:00:00.000Z
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TDRSS_JSON = join(ROOT, "src/data/tdrss.json");

const YEAR = 2026;
const WINDOW_START = Date.parse(`${YEAR}-05-29T00:00:00.000Z`);
const WINDOW_END = Date.parse(`${YEAR}-06-03T00:00:00.000Z`);
const MAX_START_DOY = 153;

const DEFAULT_CSV = resolve(
  process.env.HOME ?? "",
  "Downloads/KU-S_DOY149-163.csv",
);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const cutoffIdx = argv.indexOf("--from-cutoff");
  const fromCutoffMs =
    cutoffIdx >= 0 && argv[cutoffIdx + 1]
      ? Date.parse(argv[cutoffIdx + 1])
      : null;
  const csvPath =
    argv.find(
      (a, i) =>
        !a.startsWith("-") &&
        (cutoffIdx < 0 || i !== cutoffIdx + 1) &&
        a !== "--from-cutoff",
    ) ?? DEFAULT_CSV;
  return {
    csvPath,
    dryRun,
    mode: fromCutoffMs != null && Number.isFinite(fromCutoffMs) ? "tail" : "window",
    fromCutoffMs,
  };
}

/** Parse a single CSV line with quoted fields. */
function parseCsvLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      let value = "";
      while (end < line.length) {
        if (line[end] === '"') {
          if (line[end + 1] === '"') {
            value += '"';
            end += 2;
            continue;
          }
          fields.push(value);
          i = end + 1;
          if (line[i] === ",") i += 1;
          break;
        }
        value += line[end];
        end += 1;
      }
      continue;
    }
    const comma = line.indexOf(",", i);
    if (comma === -1) {
      fields.push(line.slice(i));
      break;
    }
    fields.push(line.slice(i, comma));
    i = comma + 1;
  }
  return fields;
}

function doyTimeTokenMs(year, token) {
  const slash = token.indexOf("/");
  if (slash === -1) return NaN;
  const doy = Number(token.slice(0, slash));
  const parts = token.slice(slash + 1).split(":").map(Number);
  if (!Number.isFinite(doy) || parts.length !== 3) return NaN;
  const [h, m, s] = parts;
  const jan1 = Date.UTC(year, 0, 1);
  const dayStart = jan1 + (doy - 1) * 86_400_000;
  return dayStart + ((h * 60 + m) * 60 + s) * 1000;
}

function toIso(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, ".000Z");
}

function parseDoyToken(year, token) {
  const ms = doyTimeTokenMs(year, token.trim());
  if (!Number.isFinite(ms)) return null;
  return toIso(ms);
}

function startDoyFromToken(token) {
  const slash = token.indexOf("/");
  if (slash === -1) return NaN;
  return Number(token.slice(0, slash));
}

function serviceToBand(service) {
  const s = service.trim().toUpperCase();
  if (s === "S AVAIL") return "s";
  if (s === "KU AVAIL") return "ku";
  return null;
}

function overlapsWindow(startMs, endMs, windowStart, windowEnd) {
  return endMs > windowStart && startMs < windowEnd;
}

function csvRowIncluded(
  mode,
  startTok,
  startMs,
  endMs,
  { windowStart, windowEnd, fromCutoffMs },
) {
  if (mode === "tail") {
    return startMs >= fromCutoffMs;
  }
  if (!overlapsWindow(startMs, endMs, windowStart, windowEnd)) return false;
  const startDoy = startDoyFromToken(startTok);
  if (Number.isFinite(startDoy) && startDoy > MAX_START_DOY) return false;
  return true;
}

function loadCsvPasses(csvPath, mode, cutoffOpts) {
  const text = readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const passes = [];
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.toLowerCase().includes("start time")) continue;

    const [startTok, endTok, service, value] = parseCsvLine(line);
    if (!startTok || !endTok || !service) continue;
    if (value?.trim().toLowerCase() !== "true") continue;

    const band = serviceToBand(service);
    if (!band) {
      skipped += 1;
      continue;
    }

    const start = parseDoyToken(YEAR, startTok);
    const end = parseDoyToken(YEAR, endTok);
    if (!start || !end) {
      skipped += 1;
      continue;
    }

    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      skipped += 1;
      continue;
    }

    if (!csvRowIncluded(mode, startTok, startMs, endMs, cutoffOpts)) continue;

    passes.push({ band, start, end });
  }

  return { passes, skipped };
}

function sortPasses(passes) {
  return [...passes].sort((a, b) => {
    const t = Date.parse(a.start) - Date.parse(b.start);
    if (t !== 0) return t;
    return a.band.localeCompare(b.band);
  });
}

function mergeWindow(existing, incoming) {
  const kept = existing.filter((p) => {
    const startMs = Date.parse(p.start);
    const endMs = Date.parse(p.end);
    return !overlapsWindow(startMs, endMs, WINDOW_START, WINDOW_END);
  });
  return {
    merged: sortPasses([...kept, ...incoming]),
    removed: existing.length - kept.length,
    kept: kept.length,
    added: incoming.length,
  };
}

function mergeTail(existing, incoming, fromCutoffMs) {
  const kept = existing.filter((p) => Date.parse(p.start) < fromCutoffMs);
  return {
    merged: sortPasses([...kept, ...incoming]),
    removed: existing.length - kept.length,
    kept: kept.length,
    added: incoming.length,
  };
}

function main() {
  const { csvPath, dryRun, mode, fromCutoffMs } = parseArgs(process.argv.slice(2));

  const cutoffOpts = {
    windowStart: WINDOW_START,
    windowEnd: WINDOW_END,
    fromCutoffMs,
  };

  const { passes: incoming, skipped } = loadCsvPasses(csvPath, mode, cutoffOpts);
  const existing = JSON.parse(readFileSync(TDRSS_JSON, "utf8"));

  const { merged, removed, kept, added } =
    mode === "tail"
      ? mergeTail(existing, incoming, fromCutoffMs)
      : mergeWindow(existing, incoming);

  console.log("CSV:", csvPath);
  console.log("Mode:", mode);
  if (mode === "tail") {
    console.log("Cutoff (keep before):", toIso(fromCutoffMs));
  } else {
    console.log("Window:", toIso(WINDOW_START), "→", toIso(WINDOW_END), "(exclusive end)");
  }
  console.log("CSV rows imported:", added, "(skipped invalid/non-import:", skipped, ")");
  console.log("Kept from existing:", kept, "(removed:", removed, ")");
  console.log("Total passes:", existing.length, "→", merged.length);

  if (mode === "tail") {
    const prefix = merged.filter((p) => Date.parse(p.start) < fromCutoffMs);
    const tail = merged.filter((p) => Date.parse(p.start) >= fromCutoffMs);
    if (prefix.length > 0) {
      console.log("Last kept:", prefix[prefix.length - 1]);
    }
    if (tail.length > 0) {
      console.log("First imported:", tail[0]);
      console.log("Last imported:", tail[tail.length - 1]);
    }
  } else {
    const inWindow = merged.filter((p) => {
      const s = Date.parse(p.start);
      const e = Date.parse(p.end);
      return overlapsWindow(s, e, WINDOW_START, WINDOW_END);
    });
    if (inWindow.length > 0) {
      console.log("First in window:", inWindow[0]);
      console.log("Last in window:", inWindow[inWindow.length - 1]);
    }
    const afterWindow = merged.find((p) => Date.parse(p.start) >= WINDOW_END);
    if (afterWindow) {
      console.log("First pass after window:", afterWindow);
    }
  }

  if (dryRun) {
    console.log("\n--dry-run: no file written.");
    return;
  }

  writeFileSync(TDRSS_JSON, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log("\nWrote", TDRSS_JSON);
}

main();
