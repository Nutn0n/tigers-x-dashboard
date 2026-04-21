"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DASHBOARD_PANEL_BOX_MIN_HEIGHT_CLASS } from "@/lib/dashboard-panel-styles";

function IconExpand({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

type FullscreenPanelProps = {
  children: ReactNode;
  /** Merged onto the root in both inline and fullscreen layouts (e.g. flex direction). */
  className?: string;
  /** Min height when not fullscreen (`min-h-0 h-full` when stacked in a flex column). */
  collapseMinHeightClass?: string;
};

export function FullscreenPanel({
  children,
  className = "",
  collapseMinHeightClass = DASHBOARD_PANEL_BOX_MIN_HEIGHT_CLASS,
}: FullscreenPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, close]);

  const rootCollapsed =
    `relative z-0 min-w-0 w-full ${collapseMinHeightClass} ${className}`.trim();
  const rootExpanded =
    `fixed inset-0 z-[200] flex w-full flex-col overflow-auto bg-[#000] p-4 pt-14 text-[#eee] ${className}`.trim();

  return (
    <div className={expanded ? rootExpanded : rootCollapsed}>
      {!expanded ? (
        <button
          type="button"
          className="absolute right-1 top-1 z-10 rounded p-1.5 text-[#eee]/70 transition-colors hover:bg-[#eee]/10 hover:text-[#eee]"
          aria-label="View in fullscreen"
          onClick={() => setExpanded(true)}
        >
          <IconExpand />
        </button>
      ) : (
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded p-1.5 text-[#eee]/70 transition-colors hover:bg-[#eee]/10 hover:text-[#eee]"
          aria-label="Close fullscreen"
          onClick={close}
        >
          <IconClose />
        </button>
      )}
      <div
        className={
          expanded
            ? "flex min-h-0 min-w-0 w-full flex-1 flex-col self-stretch overflow-auto"
            : "flex min-h-0 min-w-0 w-full flex-1 flex-col self-stretch"
        }
      >
        {children}
      </div>
    </div>
  );
}
