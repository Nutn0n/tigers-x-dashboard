/** Outer page shell for mission control views. */
export const DASHBOARD_PAGE_SHELL =
  "flex min-h-0 flex-1 flex-col overflow-hidden bg-[#000] text-[#eee]";

/** Full-width scrollable content under the top bar. */
export const DASHBOARD_CONTENT_MAX =
  "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 pb-8 md:px-4 md:pb-12";

/** ISS (¼) + Timeline (¾). */
export const DASHBOARD_TOP_GRID =
  "mt-6 grid min-h-0 min-w-0 shrink-0 grid-cols-1 gap-4 md:mt-8 md:grid-cols-[1fr_3fr] md:gap-6";

export const DASHBOARD_TOP_GRID_CELL = "min-h-0 min-w-0";

/** Three equal columns: Microfludic | Activity Monitor | Telemetry. */
export const DASHBOARD_QUARTER_OUTER =
  "mt-6 grid min-h-0 min-w-0 shrink-0 grid-cols-1 gap-4 md:mt-8 md:grid-cols-3 md:gap-6";

export const DASHBOARD_QUARTER_CELL =
  "flex h-full min-h-0 min-w-0 flex-col overflow-hidden";
