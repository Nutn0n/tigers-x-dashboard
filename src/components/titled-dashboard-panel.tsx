"use client";

import { FullscreenPanel } from "@/components/FullscreenPanel";
import {
  DASHBOARD_PANEL_SECTION_CLASS,
  DASHBOARD_PANEL_TITLE_CLASS,
} from "@/lib/dashboard-panel-styles";

export type TitledDashboardPanelVariant = "gridCell" | "tallStrip";

type TitledDashboardPanelProps = {
  title: string;
  /** Stable id segment, e.g. `"trajectory"` → `trajectory-panel-title`. */
  panelId: string;
  /** `tallStrip`: Microfludic column spanning two grid row heights. */
  variant?: TitledDashboardPanelVariant;
};

const VARIANT_ROOT_CLASS: Record<TitledDashboardPanelVariant, string> = {
  gridCell: "flex h-full min-h-0 flex-col items-center",
  tallStrip: "flex h-full min-h-0 flex-1 flex-col items-center",
};

export function TitledDashboardPanel({
  title,
  panelId,
  variant = "gridCell",
}: TitledDashboardPanelProps) {
  const titleId = `${panelId}-panel-title`;
  return (
    <FullscreenPanel className={VARIANT_ROOT_CLASS[variant]}>
      <section
        className={DASHBOARD_PANEL_SECTION_CLASS}
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={DASHBOARD_PANEL_TITLE_CLASS}>
          {title}
        </h2>
      </section>
    </FullscreenPanel>
  );
}
