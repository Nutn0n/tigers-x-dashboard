"use client";

import { ConfettiBurst } from "@/components/confetti-burst";
import {
  DOT_AOS,
  DOT_LOS,
  DOT_UNKNOWN,
  LABEL,
  LINK_PASS_BAND_LABEL_CLASS,
  LINK_PASS_BAND_ROW_CLASS,
  LINK_PASS_LINKS_ROW_CLASS,
} from "@/lib/dashboard-top-bar-styles";
import { formatUtcDateDdMmYyyy } from "@/lib/dashboard-time";
import type { LinkPassEndpoint } from "@/lib/link-pass-status";
import { PLACEHOLDER_LINK_PASS_STATUS } from "@/lib/link-pass-status";
import { getCubeDeactivationLabel } from "@/lib/countdown-target";
import Link from "next/link";
import { useEffect, useState } from "react";

function useEverySecond(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatUtcClock(now: Date): string {
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full sm:size-3"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      title={label}
      aria-hidden
    />
  );
}

function LinkBlock({
  title,
  value,
  dotColor,
}: {
  title: string;
  value: string;
  dotColor: string;
}) {
  return (
    <div className="text-center">
      <span className={`flex items-center justify-center gap-1.5 ${LABEL}`}>
        {title}
        <StatusDot color={dotColor} label={title} />
      </span>
      <p className="m-0 text-xl font-medium tabular-nums sm:text-2xl md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function linkDotColor(endpoint: LinkPassEndpoint, kind: "aos" | "los") {
  const active = kind === "aos" ? endpoint.aosActive : endpoint.losActive;
  if (!active) return DOT_UNKNOWN;
  return kind === "aos" ? DOT_AOS : DOT_LOS;
}

function BandRow({
  bandLabel,
  endpoint,
}: {
  bandLabel: string;
  endpoint: LinkPassEndpoint;
}) {
  return (
    <div className={LINK_PASS_BAND_ROW_CLASS}>
      <p className={LINK_PASS_BAND_LABEL_CLASS}>{bandLabel}</p>
      <div className={LINK_PASS_LINKS_ROW_CLASS}>
        <LinkBlock
          title="AOS"
          value={endpoint.aosDisplay}
          dotColor={linkDotColor(endpoint, "aos")}
        />
        <LinkBlock
          title="LOS"
          value={endpoint.losDisplay}
          dotColor={linkDotColor(endpoint, "los")}
        />
      </div>
    </div>
  );
}

export function CountdownPage() {
  const now = useEverySecond();
  const [confettiBurstKey, setConfettiBurstKey] = useState(1);
  const linkStatus = PLACEHOLDER_LINK_PASS_STATUS;

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#000] text-[#eee]">
      <ConfettiBurst burstKey={confettiBurstKey} />

      <header className="flex flex-wrap items-stretch justify-center gap-4 border-b border-solid border-[#eee]/15 px-4 py-6 md:gap-8 md:px-8">
        <div className="flex min-w-[12rem] flex-col items-center justify-center rounded-[10px] bg-[#000] px-4 py-3 text-center">
          <span className={LABEL}>UTC</span>
          <span className="text-sm tabular-nums text-[#eee]/70">
            {formatUtcDateDdMmYyyy(now)}
          </span>
          <span className="text-3xl font-medium tabular-nums md:text-4xl">
            {formatUtcClock(now)}
          </span>
        </div>

        <div className="flex min-w-[18rem] flex-1 flex-col justify-center gap-3 rounded-[10px] bg-[#000] px-4 py-3 md:max-w-xl">
          <span className={`${LABEL} w-full text-center`}>ISS Link Pass</span>
          <BandRow bandLabel="S-Band" endpoint={linkStatus.sBand} />
          <BandRow bandLabel="KU-Band" endpoint={linkStatus.kuBand} />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="m-0 text-sm font-medium uppercase tracking-[0.2em] text-[#eee]/60 sm:text-base">
          Countdown to
        </p>
        <h1 className="m-0 mt-2 max-w-3xl text-xl font-semibold uppercase tracking-wide text-[#eee]/90 sm:text-2xl md:text-3xl">
          {getCubeDeactivationLabel()}
        </h1>

        <button
          type="button"
          onClick={() => setConfettiBurstKey((k) => k + 1)}
          className="mt-8 cursor-pointer border-0 bg-transparent p-0 text-[clamp(3rem,12vw,8rem)] font-bold tabular-nums leading-none text-[#22c55e] transition-opacity hover:opacity-90"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Payload deactivated. Click to celebrate again."
        >
          DEACTIVATED
        </button>

        <p className="mt-6 max-w-lg text-sm text-[#eee]/70 sm:text-base">
          Experiment cube deactivation complete. The TIGERS-X payload has concluded
          operations aboard the ISS.
        </p>
      </main>

      <footer className="border-t border-solid border-[#eee]/10 px-4 py-4 text-center">
        <Link
          href="/"
          className="text-xs uppercase tracking-wider text-[#eee]/50 transition-colors hover:text-[#eee]/90"
        >
          ← Mission Control Dashboard
        </Link>
      </footer>
    </div>
  );
}
