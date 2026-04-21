"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DEFAULT_TIMEZONE_SLOTS,
  formatGmtYearElapsed,
  formatTimeZoneClock,
  formatUtcDateDdMmYyyy,
  ianaForTimezoneChoiceId,
  isTimezoneChoiceId,
  replaceTimezoneSlot,
  TIMEZONE_OPTIONS,
  type TimezoneSlotTuple,
} from "@/lib/dashboard-time";

const BOX =
  "rounded-[10px] border-[1px] border-solid border-[#a9a9a9] bg-[#000] text-[#eee] flex flex-col items-center justify-center text-center";

const LOGO_FRAME = "rounded-[10px] bg-[#000] relative overflow-hidden";

const TILE_MY = "my-2";

const tile = (extra: string) => `${BOX} ${TILE_MY} ${extra}`.trim();

const LABEL =
  "w-full text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm";

const SELECT =
  "max-w-full cursor-pointer rounded-[6px] border-0 bg-[#000] px-1 py-0.5 text-center text-xs font-medium uppercase tracking-wider text-[#eee] sm:text-sm";

const DOT_AOS = "#1DB100";
const DOT_LOS = "#EE220D";
const DOT_UNKNOWN = "#A9A9A9";

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
      <span
        className={`flex items-center justify-center gap-1.5 ${LABEL}`}
      >
        {title}
        <StatusDot color={dotColor} label={dotLabel} />
      </span>
      <p className="m-0 text-2xl font-medium tabular-nums md:text-3xl">{value}</p>
    </div>
  );
}

export function DashboardTopBar() {
  const [now, setNow] = useState(() => new Date());
  const [timezoneSlots, setTimezoneSlots] = useState<TimezoneSlotTuple>(
    DEFAULT_TIMEZONE_SLOTS,
  );

  const aosActive = false;
  const losActive = false;

  const aosDotColor = aosActive ? DOT_AOS : DOT_UNKNOWN;
  const losDotColor = losActive ? DOT_LOS : DOT_UNKNOWN;
  const aosDotLabel = aosActive ? "AOS: acquired" : "AOS: status unknown";
  const losDotLabel = losActive ? "LOS: loss of signal" : "LOS: status unknown";

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const gmtElapsed = formatGmtYearElapsed(now);
  const gmtDate = formatUtcDateDdMmYyyy(now);

  return (
    <header className="w-full">
      <div className="flex flex-wrap items-stretch gap-3 md:gap-4">
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

        <div
          className={tile(
            "w-[11.5rem] max-w-[11.5rem] shrink-0 px-2 md:w-[12rem] md:max-w-[12rem]",
          )}
        >
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
          <span className="w-full text-xs text-[#eee]/60 sm:text-sm">
            ddd:hh:mm:ss
          </span>
        </div>

        <div className={tile("min-w-0 flex-1 px-3 md:min-w-[22rem]")}>
          <div className="grid w-full grid-cols-3 justify-items-center gap-x-2 text-center sm:gap-x-3">
            {([0, 1, 2] as const).map((slot) => {
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
                  <span className="text-xl font-medium tabular-nums md:text-2xl">
                    {localTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={tile("min-w-[9rem] flex-1 px-3")}>
          <span className={LABEL}>Mission Elapsed Time</span>
          <span className="w-full text-2xl font-medium tabular-nums text-[#eee]/50 md:text-3xl">
            —:—:—
          </span>
          <span className="w-full text-xs text-[#eee]/50 sm:text-sm">TBD</span>
        </div>

        <div className={tile("min-w-[12rem] flex-1 px-3")}>
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
      </div>
    </header>
  );
}
