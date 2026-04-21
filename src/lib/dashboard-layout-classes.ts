/** Outer page shell for mission control views. */
export const DASHBOARD_PAGE_SHELL =
  "min-h-screen bg-[#000] text-[#eee]";

/** Constrained content width under the top bar. */
export const DASHBOARD_CONTENT_MAX =
  "mx-auto w-full max-w-[2000px] px-3 md:px-4";

/** ISS (¼) + Timeline (¾). */
export const DASHBOARD_TOP_GRID =
  "mt-6 grid min-w-0 grid-cols-[1fr_3fr] gap-4 md:mt-8 md:gap-6";

export const DASHBOARD_TOP_GRID_CELL = "min-h-0 min-w-0";

/** Microfludic strip + six tiles (two 1fr rows × three columns). */
export const DASHBOARD_QUARTER_OUTER =
  "mt-6 flex min-h-[min(520px,70vh)] min-w-0 items-stretch gap-4 md:mt-8 md:gap-6";

export const DASHBOARD_MICRO_COLUMN =
  "flex min-h-0 w-1/4 shrink-0 flex-col self-stretch";

export const DASHBOARD_QUARTER_INNER_GRID =
  "grid min-h-0 min-w-0 flex-1 grid-cols-3 grid-rows-[1fr_1fr] gap-4 md:gap-6";

export const DASHBOARD_QUARTER_CELL = "flex h-full min-h-0 min-w-0";
