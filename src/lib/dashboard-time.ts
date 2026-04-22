/** Clock / timezone helpers for the mission dashboard top bar. */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

/**
 * Non-negative duration as `hh:mm:ss` (hours may exceed 23; hours use at least
 * two digits when under 100).
 */
export function formatHhMmSsFromDurationMs(durationMs: number) {
  let sec = Math.floor(Math.max(0, durationMs) / 1000);
  const h = Math.floor(sec / 3600);
  sec %= 3600;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${pad2(m)}:${pad2(s)}`;
}

/** `ddd:hh:mm:ss` from a non-negative whole-second duration. */
function formatDddHhMmSs(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const rem = totalSeconds % 86400;
  const hours = Math.floor(rem / 3600);
  const minutes = Math.floor((rem % 3600) / 60);
  const seconds = rem % 60;
  return `${pad3(days)}:${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

/** Elapsed since 1 Jan 00:00:00 UTC of the current year — `ddd:hh:mm:ss`. */
export function formatGmtYearElapsed(now: Date) {
  const year = now.getUTCFullYear();
  const startMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  let diffMs = now.getTime() - startMs;
  if (diffMs < 0) diffMs = 0;
  return formatDddHhMmSs(Math.floor(diffMs / 1000));
}

/** Mission elapsed time since `epochUtcMs` — `ddd:hh:mm:ss` (clamped before epoch). */
export function formatMissionElapsedTime(now: Date, epochUtcMs: number) {
  let diffMs = now.getTime() - epochUtcMs;
  if (diffMs < 0) diffMs = 0;
  return formatDddHhMmSs(Math.floor(diffMs / 1000));
}

export function formatTimeZoneClock(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

/** Current UTC calendar date as `dd/mm/yyyy`. */
export function formatUtcDateDdMmYyyy(now: Date) {
  const d = pad2(now.getUTCDate());
  const m = pad2(now.getUTCMonth() + 1);
  const y = String(now.getUTCFullYear()).padStart(4, "0");
  return `${d}/${m}/${y}`;
}

/** Wall-clock date and time in Bangkok (`Asia/Bangkok`), `dd/mm/yyyy` + 24h time. */
export function formatBangkokDateTime(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

/** Bangkok local time for an instant: `dd/mm/yy hh:mm:ss` (24h). */
export function formatBangkokDdMmYyHhMmSs(at: Date) {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(at);
  return s.replace(", ", " ");
}

/**
 * City dropdown: unique `id` per option (Houston vs Huntsville both use
 * `America/Chicago`).
 */
export const TIMEZONE_OPTIONS = [
  { id: "bangkok", label: "Bangkok", iana: "Asia/Bangkok" },
  { id: "brussel", label: "Brussel", iana: "Europe/Brussels" },
  { id: "houston", label: "Houston", iana: "America/Chicago" },
  { id: "moscow", label: "Moscow", iana: "Europe/Moscow" },
  { id: "huntsville", label: "Huntsville", iana: "America/Chicago" },
  { id: "tsukuba", label: "Tsukuba", iana: "Asia/Tokyo" },
  { id: "munich", label: "Munich", iana: "Europe/Berlin" },
] as const;

export type TimezoneChoiceId = (typeof TIMEZONE_OPTIONS)[number]["id"];

export type TimezoneSlotTuple = [
  TimezoneChoiceId,
  TimezoneChoiceId,
  TimezoneChoiceId,
];

export const DEFAULT_TIMEZONE_SLOTS: TimezoneSlotTuple = [
  "bangkok",
  "brussel",
  "houston",
];

export function ianaForTimezoneChoiceId(id: string): string {
  const found = TIMEZONE_OPTIONS.find((o) => o.id === id);
  return found?.iana ?? "UTC";
}

export function isTimezoneChoiceId(id: string): id is TimezoneChoiceId {
  return TIMEZONE_OPTIONS.some((o) => o.id === id);
}

export function replaceTimezoneSlot(
  slots: TimezoneSlotTuple,
  slotIndex: 0 | 1 | 2,
  id: TimezoneChoiceId,
): TimezoneSlotTuple {
  const next: TimezoneChoiceId[] = [...slots];
  next[slotIndex] = id;
  return next as TimezoneSlotTuple;
}
