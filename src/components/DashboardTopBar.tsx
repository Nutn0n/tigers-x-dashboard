"use client";

import Image from "next/image";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import timelineData from "@/data/timeline.json";
import {
  DEFAULT_TIMEZONE_SLOTS,
  formatGmtYearElapsed,
  formatMissionElapsedTime,
  formatTimeZoneClock,
  formatUtcDateDdMmYyyy,
  ianaForTimezoneChoiceId,
  isTimezoneChoiceId,
  replaceTimezoneSlot,
  TIMEZONE_OPTIONS,
  type TimezoneSlotTuple,
} from "@/lib/dashboard-time";
import {
  AOS_LOS_TILE_EXTRA,
  DOT_AOS,
  DOT_LOS,
  DOT_UNKNOWN,
  GMT_TILE_EXTRA,
  LABEL,
  LOGO_FRAME,
  MET_TILE_EXTRA,
  SELECT,
  TILE_MY,
  TIMEZONE_SLOT_INDICES,
  TZ_TILE_EXTRA,
  tile,
} from "@/lib/dashboard-top-bar-styles";

function useEverySecond(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full sm:size-3"
      style={{ backgroundColor: color, boxShadow: `0 0 0px ${color}` }}
      title={label}
      aria-label={label}
    />
  );
}

function LinkBlock({
  title,
  value,
  dotColor,
  dotLabel,
}: {
  title: string;
  value: string;
  dotColor: string;
  dotLabel: string;
}) {
  return (
    <div className="text-center">
      <span className={`flex items-center justify-center gap-1.5 ${LABEL}`}>
        {title}
        <StatusDot color={dotColor} label={dotLabel} />
      </span>
      <p className="m-0 text-2xl font-medium tabular-nums md:text-3xl">{value}</p>
    </div>
  );
}

function BrandedImageSlot({
  frameClass,
  src,
  alt,
  sizes,
  "aria-label": ariaLabel,
}: {
  frameClass: string;
  src: string;
  alt: string;
  sizes: string;
  "aria-label": string;
}) {
  return (
    <div className={frameClass} aria-label={ariaLabel}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain object-left px-2"
        sizes={sizes}
        priority
      />
    </div>
  );
}

function GmtTile({ now }: { now: Date }) {
  const gmtElapsed = formatGmtYearElapsed(now);
  const gmtDate = formatUtcDateDdMmYyyy(now);
  return (
    <div className={tile(GMT_TILE_EXTRA)}>
      <span
        className={`flex w-full flex-wrap items-baseline justify-center gap-x-2 ${LABEL}`}
      >
        <span>GMT</span>
        <span className="text-sm font-medium tabular-nums tracking-normal text-[#eee] md:text-base">
          {gmtDate}
        </span>
      </span>
      <span className="w-full text-2xl font-medium tabular-nums tracking-tight md:text-3xl">
        {gmtElapsed}
      </span>
      <span className="w-full text-xs text-[#eee]/60 sm:text-sm">ddd:hh:mm:ss</span>
    </div>
  );
}

function LocalTimeColumns({
  now,
  timezoneSlots,
  setTimezoneSlots,
}: {
  now: Date;
  timezoneSlots: TimezoneSlotTuple;
  setTimezoneSlots: Dispatch<SetStateAction<TimezoneSlotTuple>>;
}) {
  return (
    <div className={tile(TZ_TILE_EXTRA)}>
      <div className="grid min-w-0 w-full grid-cols-3 justify-items-center gap-x-1 text-center sm:gap-x-2 md:gap-x-3">
        {TIMEZONE_SLOT_INDICES.map((slot) => {
          const choiceId = timezoneSlots[slot];
          const iana = ianaForTimezoneChoiceId(choiceId);
          const localTime = formatTimeZoneClock(now, iana);
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
                className={SELECT}
                value={choiceId}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (!isTimezoneChoiceId(raw)) return;
                  setTimezoneSlots((prev) =>
                    replaceTimezoneSlot(prev, slot, raw),
                  );
                }}
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-base font-medium tabular-nums sm:text-xl md:text-2xl">
                {localTime}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MISSION_EPOCH_MS = Date.parse(timelineData.mission.epoch);

const TOPBAR_COLLAPSED_KEY = "dashboard-topbar-collapsed";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 5.25L7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 8.75L7 5.25l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetTile({ now }: { now: Date }) {
  const met =
    Number.isFinite(MISSION_EPOCH_MS) && MISSION_EPOCH_MS > 0
      ? formatMissionElapsedTime(now, MISSION_EPOCH_MS)
      : "—:—:—:—";

  return (
    <div className={tile(MET_TILE_EXTRA)}>
      <span className={LABEL}>Mission Elapsed Time</span>
      <span className="w-full text-2xl font-medium tabular-nums md:text-3xl">
        {met}
      </span>
      <span className="w-full text-xs text-[#eee]/60 sm:text-sm">ddd:hh:mm:ss</span>
    </div>
  );
}

function AosLosTile({
  aosActive,
  losActive,
}: {
  aosActive: boolean;
  losActive: boolean;
}) {
  const aosDotColor = aosActive ? DOT_AOS : DOT_UNKNOWN;
  const losDotColor = losActive ? DOT_LOS : DOT_UNKNOWN;
  const aosDotLabel = aosActive ? "AOS: acquired" : "AOS: status unknown";
  const losDotLabel = losActive ? "LOS: loss of signal" : "LOS: status unknown";

  return (
    <div className={tile(AOS_LOS_TILE_EXTRA)}>
      <div className="flex w-full flex-wrap items-baseline justify-center gap-x-4">
        <LinkBlock
          title="AOS"
          value="+00:00:00"
          dotColor={aosDotColor}
          dotLabel={aosDotLabel}
        />
        <LinkBlock
          title="LOS"
          value="00:00:000"
          dotColor={losDotColor}
          dotLabel={losDotLabel}
        />
      </div>
    </div>
  );
}

export function DashboardTopBar() {
  const now = useEverySecond();
  const [timezoneSlots, setTimezoneSlots] = useState<TimezoneSlotTuple>(
    DEFAULT_TIMEZONE_SLOTS,
  );
  const [topBarCollapsed, setTopBarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(TOPBAR_COLLAPSED_KEY) === "1") {
        setTopBarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTopBar = () => {
    setTopBarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(TOPBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const aosActive = false;
  const losActive = false;

  return (
    <div className="w-full">
      <div
        id="dashboard-top-bar-main"
        className={topBarCollapsed ? "hidden" : "block"}
        aria-hidden={topBarCollapsed}
      >
        <header className="w-full">
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-stretch md:gap-4">
            <div className="flex w-full flex-shrink-0 flex-row items-center justify-center gap-3 md:contents">
              <BrandedImageSlot
                frameClass={`${LOGO_FRAME} ${TILE_MY} aspect-square w-[min(22vw,7.5rem)] shrink-0`}
                src="/patch.png"
                alt="Mission patch"
                sizes="(max-width: 768px) 22vw, 120px"
                aria-label="Mission patch"
              />

              <BrandedImageSlot
                frameClass={`${LOGO_FRAME} ${TILE_MY} aspect-[3/1] h-[min(11vw,60px)] shrink-0 self-center`}
                src="/logo.png"
                alt="Company logo"
                sizes="(max-width: 768px) 23vw, 180px"
                aria-label="Company logo"
              />
            </div>

            <GmtTile now={now} />
            <LocalTimeColumns
              now={now}
              timezoneSlots={timezoneSlots}
              setTimezoneSlots={setTimezoneSlots}
            />
            <MetTile now={now} />
            <AosLosTile aosActive={aosActive} losActive={losActive} />
          </div>
        </header>
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-center gap-1 border-t border-solid border-[#eee]/15 py-1 text-[#eee]/55 transition-colors hover:bg-[#0a0a0a] hover:text-[#eee]/90"
        onClick={toggleTopBar}
        aria-expanded={!topBarCollapsed}
        aria-controls="dashboard-top-bar-main"
        title={topBarCollapsed ? "Show top bar" : "Hide top bar"}
      >
        {topBarCollapsed ? (
          <ChevronDownIcon className="shrink-0" />
        ) : (
          <ChevronUpIcon className="shrink-0" />
        )}
        <span className="sr-only">
          {topBarCollapsed ? "Show top bar" : "Hide top bar"}
        </span>
      </button>
    </div>
  );
}
