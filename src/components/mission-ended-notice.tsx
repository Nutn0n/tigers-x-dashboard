"use client";

import { getCubeDeactivationLabel, getCubeDeactivationTargetMs } from "@/lib/countdown-target";
import { useState } from "react";

const DISMISS_KEY = "tigers-x-mission-ended-notice-dismissed";

function readNoticeOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

function formatDeactivationUtc(): string {
  const ms = getCubeDeactivationTargetMs();
  if (!Number.isFinite(ms)) return "5 June 2026, 07:50 UTC";
  const d = new Date(ms);
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${h}:${m} UTC`;
}

export function MissionEndedNotice() {
  const [open, setOpen] = useState(readNoticeOpen);

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-ended-notice-title"
        className="h-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[10px] border border-solid border-[#eee]/25 bg-[#0a0a0a] p-6 text-[#eee] shadow-[0_0_40px_rgba(0,0,0,0.6)]"
      >
        <h2
          id="mission-ended-notice-title"
          className="m-0 text-center text-lg font-semibold uppercase tracking-wide text-[#eee] sm:text-xl"
        >
          TIGERS-X Mission has Ended
        </h2>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#eee]/85 sm:text-base">
          <p className="m-0">
            <span className="font-medium text-[#eee]">
              {getCubeDeactivationLabel()}
            </span>{" "}
            was completed on{" "}
            <span className="font-mono tabular-nums text-[#eee]">
              {formatDeactivationUtc()}
            </span>
            . The TIGERS-X payload has concluded operations aboard the
            International Space Station.
          </p>
          <p className="m-0">
            The Dragon spacecraft is scheduled to undock and return the
            experiment cube to Earth on{" "}
            <span className="font-medium text-[#eee]">16 June 2026</span>.
          </p>
          <p className="m-0">
            Science data and further updates will be available at{" "}
            <a
              href="https://tigers-x.ishalab.space"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#eee] underline decoration-[#eee]/40 underline-offset-2 transition hover:decoration-[#eee]"
            >
              tigers-x.ishalab.space
            </a>
            .
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={dismiss}
            className="rounded border border-solid border-[#eee]/35 bg-[#eee]/10 px-5 py-2 text-xs font-medium uppercase tracking-wider text-[#eee] transition hover:border-[#eee]/55 hover:bg-[#eee]/15 sm:text-sm"
          >
            Continue to Archive
          </button>
        </div>
      </div>
    </div>
  );
}
