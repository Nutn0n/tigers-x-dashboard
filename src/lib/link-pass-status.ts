/**
 * Link pass status types for S-Band and KU-Band AOS/LOS display.
 * Archive mode uses fixed placeholder values (`00:00:00`).
 */

export type LinkPassBandId = "s-band" | "ku-band";

export type LinkPassEndpoint = {
  /** Drives status dot: green when true, gray when unknown/false. */
  aosActive: boolean;
  losActive: boolean;
  /** Shown under AOS (e.g. "+00:00:00"). */
  aosDisplay: string;
  /** Shown under LOS (e.g. "-00:05:00" or "00:00:00" when unavailable). */
  losDisplay: string;
};

export type LinkPassStatusSnapshot = {
  sBand: LinkPassEndpoint;
  kuBand: LinkPassEndpoint;
};

/** Shown when a band has no live AOS/LOS timer (e.g. between passes or no schedule). */
export const LINK_PASS_UNAVAILABLE_DISPLAY = "00:00:00";

const PLACEHOLDER_ENDPOINT: LinkPassEndpoint = {
  aosActive: false,
  losActive: false,
  aosDisplay: LINK_PASS_UNAVAILABLE_DISPLAY,
  losDisplay: LINK_PASS_UNAVAILABLE_DISPLAY,
};

/** Fallback when no TDRSS pass applies for a band. */
export const PLACEHOLDER_LINK_PASS_STATUS: LinkPassStatusSnapshot = {
  sBand: PLACEHOLDER_ENDPOINT,
  kuBand: PLACEHOLDER_ENDPOINT,
};
