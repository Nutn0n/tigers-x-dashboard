/** Tailwind class strings for `DashboardTopBar` tiles and typography. */

export const BOX =
  "rounded-[10px] bg-[#000] text-[#eee] flex h-auto flex-col items-center justify-center self-center text-center px-2 py-2";

export const LOGO_FRAME =
  "rounded-[10px] bg-[#000] relative shrink-0 self-center overflow-hidden";

export function tile(extra = "") {
  return [BOX, extra].filter(Boolean).join(" ");
}

export const LABEL =
  "w-full text-xs font-medium uppercase tracking-wider text-[#eee]/80 sm:text-sm";

export const SELECT =
  "max-w-full cursor-pointer rounded-[6px] border-0 bg-[#000] px-1 py-0.5 text-center text-xs font-medium uppercase tracking-wider text-[#eee] sm:text-sm";

export const DOT_AOS = "#1DB100";
export const DOT_LOS = "#EE220D";
export const DOT_UNKNOWN = "#A9A9A9";

export const GMT_TILE_EXTRA =
  "w-[11.5rem] max-w-[11.5rem] shrink-0 max-md:w-full max-md:max-w-none md:w-[12rem] md:max-w-[12rem]";

export const TZ_TILE_EXTRA =
  "min-w-0 w-full max-md:flex-none sm:px-3 md:w-auto md:flex-1 md:min-w-[22rem]";

export const MET_TILE_EXTRA =
  "min-w-[9rem] w-full max-md:flex-none md:w-auto md:flex-1 md:min-w-0";

export const AOS_LOS_TILE_EXTRA =
  "min-w-[20rem] w-full max-md:flex-none md:w-auto md:flex-1 md:min-w-[18rem]";

export const LINK_PASS_BAND_ROW_CLASS =
  "flex w-full flex-col items-center gap-1.5 first:mt-0";

export const LINK_PASS_BAND_LABEL_CLASS =
  "m-0 w-full text-center text-[10px] font-medium uppercase tracking-wider text-[#eee]/70 sm:text-xs";

export const LINK_PASS_LINKS_ROW_CLASS =
  "flex w-full flex-wrap items-baseline justify-center gap-x-4 gap-y-2";

export const TIMEZONE_SLOT_INDICES = [0, 1, 2] as const;
