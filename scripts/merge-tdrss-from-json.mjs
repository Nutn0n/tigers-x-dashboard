#!/usr/bin/env node
/**
 * Prepend TDRSS passes from a JSON file into src/data/tdrss.json
 * for passes starting before a UTC cutoff (default: 2026-05-28).
 *
 * Usage:
 *   node scripts/merge-tdrss-from-json.mjs [jsonPath] [--dry-run]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TDRSS_JSON = join(ROOT, "src/data/tdrss.json");

const CUTOFF_MS = Date.parse("2026-05-28T00:00:00.000Z");

const DEFAULT_JSON = resolve(
  process.env.HOME ?? "",
  "Downloads/s_ku_avail_2026.json",
);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const jsonPath = argv.find((a) => !a.startsWith("-")) ?? DEFAULT_JSON;
  return { jsonPath, dryRun };
}

function isValidPass(pass) {
  if (pass.band !== "s" && pass.band !== "ku") return false;
  const startMs = Date.parse(pass.start);
  const endMs = Date.parse(pass.end);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
}

function sortPasses(passes) {
  return [...passes].sort((a, b) => {
    const t = Date.parse(a.start) - Date.parse(b.start);
    if (t !== 0) return t;
    return a.band.localeCompare(b.band);
  });
}

function loadIncoming(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("Expected JSON array of passes");
  }

  const incoming = [];
  let skipped = 0;

  for (const row of raw) {
    if (!isValidPass(row)) {
      skipped += 1;
      continue;
    }
    if (Date.parse(row.start) >= CUTOFF_MS) continue;
    incoming.push({
      band: row.band,
      start: row.start,
      end: row.end,
    });
  }

  return { incoming, skipped, totalInFile: raw.length };
}

function merge(existing, incoming) {
  const kept = existing.filter((p) => Date.parse(p.start) >= CUTOFF_MS);
  const merged = sortPasses([...incoming, ...kept]);
  return {
    merged,
    kept: kept.length,
    droppedFromExisting: existing.length - kept.length,
  };
}

function main() {
  const { jsonPath, dryRun } = parseArgs(process.argv.slice(2));

  const { incoming, skipped, totalInFile } = loadIncoming(jsonPath);
  const existing = JSON.parse(readFileSync(TDRSS_JSON, "utf8"));
  const { merged, kept, droppedFromExisting } = merge(existing, incoming);

  const imported = merged.filter((p) => Date.parse(p.start) < CUTOFF_MS);
  const afterCutoff = merged.filter((p) => Date.parse(p.start) >= CUTOFF_MS);

  console.log("JSON:", jsonPath);
  console.log("Cutoff (UTC):", new Date(CUTOFF_MS).toISOString());
  console.log("Rows in file:", totalInFile, "(skipped invalid:", skipped, ")");
  console.log("Imported (start < cutoff):", incoming.length);
  console.log(
    "Kept from existing (start >= cutoff):",
    kept,
    "(dropped from existing:",
    droppedFromExisting,
    ")",
  );
  console.log("Total passes:", existing.length, "→", merged.length);

  if (imported.length > 0) {
    console.log("Earliest imported:", imported[0]);
    console.log("Last imported:", imported[imported.length - 1]);
  }
  if (afterCutoff.length > 0) {
    console.log("First kept:", afterCutoff[0]);
  }

  if (dryRun) {
    console.log("\n--dry-run: no file written.");
    return;
  }

  writeFileSync(TDRSS_JSON, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log("\nWrote", TDRSS_JSON);
}

main();
