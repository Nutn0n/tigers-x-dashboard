"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BOX =
  "rounded-[10px] border-hairline bg-[#000] text-[#eee] flex flex-col justify-center";

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
  const bangkok = formatTimeZone(now, "Asia/Bangkok");
  const brussels = formatTimeZone(now, "Europe/Brussels");
  const houston = formatTimeZone(now, "America/Chicago");

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
            className="object-contain px-2"
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
            className="object-contain px-2"
            sizes="(max-width: 768px) 23vw, 180px"
            priority
          />
        </div>

        {/* 3. GMT elapsed from Jan 1 (year) */}
        <div className={`${BOX} ${TILE_MY} min-w-[10.5rem] flex-1 px-3`}>
          <span className="text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
            GMT (from Jan 1)
          </span>
          <span className="text-xl font-medium tabular-nums tracking-tight md:text-2xl">
            {gmtElapsed}
          </span>
          <span className="text-xs text-[#eee]/60 sm:text-sm">ddd:hh:mm:ss</span>
        </div>

        {/* 4. Bangkok, Brussel, Houston — one box, names above times on one line */}
        <div className={`${BOX} ${TILE_MY} min-w-[18rem] flex-1 px-3`}>
          <div className="grid grid-cols-3 gap-x-3 text-center sm:gap-x-4">
            <div className="flex min-w-0 flex-col items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                Bangkok
              </span>
              <span className="text-lg font-medium tabular-nums md:text-xl">
                {bangkok}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                Brussel
              </span>
              <span className="text-lg font-medium tabular-nums md:text-xl">
                {brussels}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                Houston
              </span>
              <span className="text-lg font-medium tabular-nums md:text-xl">
                {houston}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Mission Elapsed Time (TBD) */}
        <div className={`${BOX} ${TILE_MY} min-w-[9rem] flex-1 px-3`}>
          <span className="text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
            Mission Elapsed Time
          </span>
          <span className="text-xl font-medium tabular-nums text-[#eee]/50 md:text-2xl">
            —:—:—
          </span>
          <span className="text-xs text-[#eee]/50 sm:text-sm">TBD</span>
        </div>

        {/* 6. AOS / LOS */}
        <div className={`${BOX} ${TILE_MY} min-w-[12rem] flex-1 px-3`}>
          <div className="flex flex-wrap items-baseline gap-x-4">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                AOS
                <StatusDot color={aosDotColor} label={aosDotLabel} />
              </span>
              <p className="m-0 text-xl font-medium tabular-nums md:text-2xl">
                +00:00:00
              </p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm">
                LOS
                <StatusDot color={losDotColor} label={losDotLabel} />
              </span>
              <p className="m-0 text-xl font-medium tabular-nums md:text-2xl">
                00:00:000
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
