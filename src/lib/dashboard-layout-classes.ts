/** Outer page shell for mission control views. */
export const DASHBOARD_PAGE_SHELL =
  "flex min-h-0 flex-1 flex-col overflow-hidden bg-[#000] text-[#eee]";

/** Constrained content width under the top bar. */
export const DASHBOARD_CONTENT_MAX =
  "mx-auto flex min-h-0 w-full max-w-[2000px] flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 pb-8 md:px-4 md:pb-12";

/** ISS (¼) + Timeline (¾). */
export const DASHBOARD_TOP_GRID =
  "mt-6 grid min-h-0 min-w-0 shrink-0 grid-cols-1 gap-4 md:mt-8 md:grid-cols-[1fr_3fr] md:gap-6";

export const DASHBOARD_TOP_GRID_CELL = "min-h-0 min-w-0";

/** Microfludic strip + six tiles (two 1fr rows × three columns). */
export const DASHBOARD_QUARTER_OUTER =
  "mt-6 flex min-h-0 min-w-0 shrink-0 flex-col gap-4 md:mt-8 md:flex-row md:items-start md:gap-6";

export const DASHBOARD_MICRO_COLUMN =
  "flex min-h-0 w-full shrink-0 flex-col md:w-1/4 md:self-stretch";

export const DASHBOARD_QUARTER_INNER_GRID =
  "grid min-h-0 min-w-0 w-full grid-cols-1 gap-4 md:min-w-0 md:flex-1 md:grid-cols-3 md:gap-6";

export const DASHBOARD_QUARTER_CELL =
  "flex h-full min-h-0 min-w-0 flex-col overflow-hidden";
