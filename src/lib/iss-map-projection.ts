/** Must match `public/map.svg` root `width` / `viewBox`. */
export const MAP_SVG_WIDTH = 1920;
export const MAP_SVG_HEIGHT = 1080;

const LAT_CLAMP = 85;
const MERCATOR_SCALE = MAP_SVG_WIDTH / (2 * Math.PI);

/**
 * Spherical Web Mercator → pixel coordinates in the map SVG space
 * ([`public/map.svg`](public/map.svg)).
 */
export function latLonToMapSvg(lat: number, lon: number): { x: number; y: number } {
  const lonClamped = Math.max(-180, Math.min(180, lon));
  const latClamped = Math.max(-LAT_CLAMP, Math.min(LAT_CLAMP, lat));
  const latRad = (latClamped * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const x = ((lonClamped + 180) / 360) * MAP_SVG_WIDTH;
  const y = MAP_SVG_HEIGHT / 2 - MERCATOR_SCALE * mercY;
  return { x, y };
}

/** Build SVG `d` for a polyline (M + L segments). */
export function trailToSvgPathD(
  points: readonly { lat: number; lon: number }[],
): string {
  if (points.length === 0) return "";
  const first = latLonToMapSvg(points[0].lat, points[0].lon);
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const p = latLonToMapSvg(points[i].lat, points[i].lon);
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

/**
 * Split a ground track when consecutive projected points jump more than half
 * the map width (dateline in Web Mercator) so each segment draws without
 * spurious horizontal chords.
 */
export function groundTrackToSvgPaths(
  points: readonly { lat: number; lon: number }[],
): string[] {
  if (points.length === 0) return [];
  const segments: { lat: number; lon: number }[][] = [];
  let current: { lat: number; lon: number }[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = latLonToMapSvg(points[i - 1].lat, points[i - 1].lon);
    const next = latLonToMapSvg(points[i].lat, points[i].lon);
    const dx = Math.abs(next.x - prev.x);
    if (dx > MAP_SVG_WIDTH / 2) {
      segments.push(current);
      current = [points[i]];
    } else {
      current.push(points[i]);
    }
  }
  segments.push(current);

  return segments
    .map((seg) => trailToSvgPathD(seg))
    .filter((d) => d.length > 0);
}

export type StrokedPathSegment = { d: string; strokeOpacity: number };

/**
 * Time-ordered points → short polylines with opacity ramp (first→last sample).
 * Chunks overlap by one vertex so there are no gaps between pieces.
 */
export function groundTrackToFadedStrokeSegments(
  points: readonly { lat: number; lon: number }[],
  options: {
    chunkCount: number;
    opacityStart: number;
    opacityEnd: number;
  },
): StrokedPathSegment[] {
  const { chunkCount, opacityStart, opacityEnd } = options;
  const out: StrokedPathSegment[] = [];
  const n = points.length;
  if (n < 2 || chunkCount < 1) return out;

  const bounds = Array.from({ length: chunkCount + 1 }, (_, k) =>
    Math.round((k / chunkCount) * (n - 1)),
  );

  for (let c = 0; c < chunkCount; c++) {
    const i0 = bounds[c];
    const i1 = bounds[c + 1];
    if (i1 <= i0) continue;

    const slice = points.slice(i0, i1 + 1);
    if (slice.length < 2) continue;

    const mid = (i0 + i1) / 2;
    const t = mid / (n - 1);
    const strokeOpacity = opacityStart + (opacityEnd - opacityStart) * t;

    for (const d of groundTrackToSvgPaths(slice)) {
      out.push({ d, strokeOpacity });
    }
  }
  return out;
}
