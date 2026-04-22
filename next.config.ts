import type { NextConfig } from "next";

/** Same value the client uses in `withBasePath` (must be set at build time). */
function basePathFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw || raw === "/") return undefined;
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed || undefined;
}

const basePath = basePathFromEnv();

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
