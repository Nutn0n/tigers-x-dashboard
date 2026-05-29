#!/usr/bin/env node
/**
 * Merge TDRSS pass windows from a DOY/HH:MM:SS CSV into src/data/tdrss.json
 * for a configurable UTC window (default: DOY 149–153, year 2026).
 *
 * Usage:
 *   node scripts/merge-tdrss-from-csv.mjs [csvPath] [--dry-run]
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
const MIN_START_DOY = 149;
const MAX_START_DOY = 153;

const DEFAULT_CSV = resolve(
  process.env.HOME ?? "",
  "Downloads/KU-S_DOY149-163.csv",
);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const csvPath = argv.find((a) => !a.startsWith("-")) ?? DEFAULT_CSV;
  return { csvPath, dryRun };
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

function overlapsWindow(startMs, endMs) {
  return endMs > WINDOW_START && startMs < WINDOW_END;
}

function csvRowOverlapsImportWindow(startToken, endToken, startMs, endMs) {
  if (!overlapsWindow(startMs, endMs)) return false;
  const startDoy = startDoyFromToken(startToken);
  if (Number.isFinite(startDoy) && startDoy > MAX_START_DOY) return false;
  return true;
}

function loadCsvPasses(csvPath) {
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

    if (!csvRowOverlapsImportWindow(startTok, endTok, startMs, endMs)) continue;

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

function merge(existing, incoming) {
  const kept = existing.filter((p) => {
    const startMs = Date.parse(p.start);
    const endMs = Date.parse(p.end);
    return !overlapsWindow(startMs, endMs);
  });

  const removed = existing.length - kept.length;
  const merged = sortPasses([...kept, ...incoming]);

  return { merged, removed, added: incoming.length };
}

function main() {
  const { csvPath, dryRun } = parseArgs(process.argv.slice(2));

  const { passes: incoming, skipped } = loadCsvPasses(csvPath);
  const existing = JSON.parse(readFileSync(TDRSS_JSON, "utf8"));
  const { merged, removed, added } = merge(existing, incoming);

  const inWindow = merged.filter((p) => {
    const s = Date.parse(p.start);
    const e = Date.parse(p.end);
    return overlapsWindow(s, e);
  });

  console.log("CSV:", csvPath);
  console.log("Window:", toIso(WINDOW_START), "→", toIso(WINDOW_END), "(exclusive end)");
  console.log("CSV rows imported:", added, "(skipped invalid/non-import:", skipped, ")");
  console.log("Removed from existing (overlap):", removed);
  console.log("Total passes:", existing.length, "→", merged.length);
  if (inWindow.length > 0) {
    console.log("First in window:", inWindow[0]);
    console.log("Last in window:", inWindow[inWindow.length - 1]);
  }

  const afterWindow = merged.find((p) => Date.parse(p.start) >= WINDOW_END);
  if (afterWindow) {
    console.log("First pass after window (unchanged):", afterWindow);
  }

  if (dryRun) {
    console.log("\n--dry-run: no file written.");
    return;
  }

  writeFileSync(TDRSS_JSON, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log("\nWrote", TDRSS_JSON);
}

main();
