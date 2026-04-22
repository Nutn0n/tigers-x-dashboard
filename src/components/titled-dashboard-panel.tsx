"use client";

import type { ReactNode } from "react";
import { FullscreenPanel } from "@/components/FullscreenPanel";
import {
  DASHBOARD_PANEL_SECTION_CLASS,
  DASHBOARD_PANEL_TITLE_CLASS,
} from "@/lib/dashboard-panel-styles";

export type TitledDashboardPanelVariant = "gridCell" | "tallStrip";

/** Section shell with no horizontal padding (title row keeps `px-10`). */
const DASHBOARD_PANEL_SECTION_FLUSH_CLASS =
  "box-border flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center rounded-[10px] border border-solid pt-1";

type TitledDashboardPanelProps = {
  title: string;
  /** Stable id segment, e.g. `"trajectory"` → `trajectory-panel-title`. */
  panelId: string;
  /** `tallStrip`: Microfludic column spanning two grid row heights. */
  variant?: TitledDashboardPanelVariant;
  /** Edge-to-edge body: no section `px-10` / inner `px-1` under the title (e.g. maps). */
  contentFlush?: boolean;
  children?: ReactNode;
};

const VARIANT_ROOT_CLASS: Record<TitledDashboardPanelVariant, string> = {
  gridCell: "flex h-full min-h-0 flex-col items-center",
  tallStrip: "flex h-full min-h-0 flex-1 flex-col items-center",
};

export function TitledDashboardPanel({
  title,
  panelId,
  variant = "gridCell",
  contentFlush = false,
  children,
}: TitledDashboardPanelProps) {
  const titleId = `${panelId}-panel-title`;
  const titleNode = (
    <h2 id={titleId} className={DASHBOARD_PANEL_TITLE_CLASS}>
      {title}
    </h2>
  );

  return (
    <FullscreenPanel className={VARIANT_ROOT_CLASS[variant]}>
      <section
        className={
          contentFlush
            ? DASHBOARD_PANEL_SECTION_FLUSH_CLASS
            : DASHBOARD_PANEL_SECTION_CLASS
        }
        aria-labelledby={titleId}
      >
        {contentFlush ? (
          <div className="w-full shrink-0 px-10">{titleNode}</div>
        ) : (
          titleNode
        )}
        {children != null ? (
          <div
            className={
              contentFlush
                ? "mt-3 flex min-h-0 w-full min-w-0 flex-1 flex-col justify-center overflow-hidden px-0 pb-3"
                : "mt-3 flex w-full min-w-0 flex-1 flex-col justify-center px-1 pb-3"
            }
          >
            {children}
          </div>
        ) : null}
      </section>
    </FullscreenPanel>
  );
}
