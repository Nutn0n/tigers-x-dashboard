"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BOX =
  "rounded-[10px] border-[1px] border-solid border-[#a9a9a9] bg-[#000] text-[#eee] flex flex-col items-center justify-center text-center";

/** Mission patch & company logo: same frame as boxes, no border (art includes its own edge). */
const LOGO_FRAME = "rounded-[10px] bg-[#000] relative overflow-hidden";

/** Vertical margin around each tile; inner content has no top/bottom padding or margin. */
const TILE_MY = "my-2";

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Elapsed since Jan 1 00:00:00 UTC of the current year: ddd:hh:mm:ss */
function formatGmtYearElapsed(now: Date) {
  const year = now.getUTCFullYear();
  const startMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  let diffMs = now.getTime() - startMs;
  if (diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const rem = totalSeconds % 86400;
  const hours = Math.floor(rem / 3600);
  const minutes = Math.floor((rem % 3600) / 60);
  const seconds = rem % 60;

  return `${pad3(days)}:${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function formatTimeZone(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

/** Dropdown choices: unique `id` per row (Houston vs Huntsville share `America/Chicago`). */
const TIMEZONE_OPTIONS = [
  { id: "bangkok", label: "Bangkok", iana: "Asia/Bangkok" },
  { id: "brussel", label: "Brussel", iana: "Europe/Brussels" },
  { id: "houston", label: "Houston", iana: "America/Chicago" },
  { id: "moscow", label: "Moscow", iana: "Europe/Moscow" },
  { id: "huntsville", label: "Huntsville", iana: "America/Chicago" },
  { id: "tsukuba", label: "Tsukuba", iana: "Asia/Tokyo" },
  { id: "munich", label: "Munich", iana: "Europe/Berlin" },
] as const;

function ianaForTimezoneChoiceId(id: string): string {
  const found = TIMEZONE_OPTIONS.find((o) => o.id === id);
  return found?.iana ?? "UTC";
}

const SELECT_CLASS =
  "max-w-full cursor-pointer rounded-[6px] border-0 bg-[#000] px-1 py-0.5 text-center text-xs font-medium uppercase tracking-wider text-[#eee] sm:text-sm";

/** Current UTC calendar date as dd/mm/yyyy. */
function formatUtcDateDdMmYyyy(now: Date) {
  const d = pad2(now.getUTCDate());
  const m = pad2(now.getUTCMonth() + 1);
  const y = String(now.getUTCFullYear()).padStart(4, "0");
  return `${d}/${m}/${y}`;
}

const COLOR_AOS = "#1DB100";
const COLOR_LOS = "#EE220D";
const COLOR_UNKNOWN = "#A9A9A9";

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full sm:size-3"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      title={label}
      aria-label={label}
    />
  );
}

export function DashboardTopBar() {
  const [now, setNow] = useState(() => new Date());
  const [timezoneSlotIds, setTimezoneSlotIds] = useState<
    [string, string, string]
  >(["bangkok", "brussel", "houston"]);

  /** Wire to telemetry: true when in AOS / LOS respectively; both false = unknown (gray dots). */
  const aosActive = false;
  const losActive = false;

  const aosDotColor = aosActive ? COLOR_AOS : COLOR_UNKNOWN;
  const losDotColor = losActive ? COLOR_LOS : COLOR_UNKNOWN;
  const aosDotLabel = aosActive ? "AOS: acquired" : "AOS: status unknown";
  const losDotLabel = losActive ? "LOS: loss of signal" : "LOS: status unknown";

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const gmtElapsed = formatGmtYearElapsed(now);
  const gmtDateDdMmYyyy = formatUtcDateDdMmYyyy(now);

  return (
    <header className="w-full">
      <div className="flex flex-wrap items-stretch gap-3 md:gap-4">
        {/* 1. Mission patch — 1:1 (`public/patch.png`) */}
        <div
          className={`${LOGO_FRAME} ${TILE_MY} aspect-square w-[min(22vw,7.5rem)] shrink-0`}
          aria-label="Mission patch"
        >
          <Image
            src="/patch.png"
            alt="Mission patch"
            fill
            className="object-contain object-left px-2"
            sizes="(max-width: 768px) 22vw, 120px"
            priority
          />
        </div>

        {/* 2. Company logo — 3:1 (`public/logo.png`) */}
        <div
          className={`${LOGO_FRAME} ${TILE_MY} aspect-[3/1] h-[min(11vw,60px)] shrink-0 self-center`}
          aria-label="Company logo"
        >
          <Image
            src="/logo.png"
            alt="Company logo"
            fill
            className="object-contain object-left px-2"
            sizes="(max-width: 768px) 23vw, 180px"
            priority
          />
        </div>

        {/* 3. GMT: UTC date (dd/mm/yyyy) + year elapsed since 1 Jan UTC */}
        <div
          className={`${BOX} ${TILE_MY} w-[11.5rem] max-w-[11.5rem] shrink-0 px-2 md:w-[12rem] md:max-w-[12rem]`}
        >
          <span className="flex w-full flex-wrap items-baseline justify-center gap-x-2 text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
            <span>GMT</span>
            <span className="text-sm font-medium tabular-nums tracking-normal text-[#eee] md:text-base">
              {gmtDateDdMmYyyy}
            </span>
          </span>
          <span className="w-full text-2xl font-medium tabular-nums tracking-tight md:text-3xl">
            {gmtElapsed}
          </span>
          <span className="w-full text-xs text-[#eee]/60 sm:text-sm">
            ddd:hh:mm:ss
          </span>
        </div>

        {/* 4. Local times — three columns; each `<select>` picks city / IANA zone */}
        <div className={`${BOX} ${TILE_MY} min-w-0 flex-1 px-3 md:min-w-[22rem]`}>
          <div className="grid w-full grid-cols-3 justify-items-center gap-x-2 text-center sm:gap-x-3">
            {([0, 1, 2] as const).map((slot) => {
              const choiceId = timezoneSlotIds[slot];
              const iana = ianaForTimezoneChoiceId(choiceId);
              const localTime = formatTimeZone(now, iana);
              return (
                <div
                  key={slot}
                  className="flex min-w-0 flex-col items-center gap-0.5"
                >
                  <label className="sr-only" htmlFor={`tz-slot-${slot}`}>
                    Time zone column {slot + 1}
                  </label>
                  <select
                    id={`tz-slot-${slot}`}
                    className={SELECT_CLASS}
                    value={choiceId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTimezoneSlotIds((prev) => {
                        const next: [string, string, string] = [...prev] as [
                          string,
                          string,
                          string,
                        ];
                        next[slot] = value;
                        return next;
                      });
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xl font-medium tabular-nums md:text-2xl">
                    {localTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Mission Elapsed Time (TBD) */}
        <div className={`${BOX} ${TILE_MY} min-w-[9rem] flex-1 px-3`}>
          <span className="w-full text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
            Mission Elapsed Time
          </span>
          <span className="w-full text-2xl font-medium tabular-nums text-[#eee]/50 md:text-3xl">
            —:—:—
          </span>
          <span className="w-full text-xs text-[#eee]/50 sm:text-sm">TBD</span>
        </div>

        {/* 6. AOS / LOS */}
        <div className={`${BOX} ${TILE_MY} min-w-[12rem] flex-1 px-3`}>
          <div className="flex w-full flex-wrap items-baseline justify-center gap-x-4">
            <div className="text-center">
              <span className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                AOS
                <StatusDot color={aosDotColor} label={aosDotLabel} />
              </span>
              <p className="m-0 text-2xl font-medium tabular-nums md:text-3xl">
                +00:00:00
              </p>
            </div>
            <div className="text-center">
              <span className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                LOS
                <StatusDot color={losDotColor} label={losDotLabel} />
              </span>
              <p className="m-0 text-2xl font-medium tabular-nums md:text-3xl">
                00:00:000
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
