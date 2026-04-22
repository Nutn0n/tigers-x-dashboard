/**
 * Prefix absolute paths when the app uses `basePath` (see `next.config.ts`).
 * Set `NEXT_PUBLIC_BASE_PATH` before `next build` (e.g. `/mission-ui`) so
 * `/public` files and API routes resolve correctly in production.
 */
export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, "") ?? "";
  if (!base) return normalized;
  return `${base}${normalized}`;
}
