import type { NextConfig } from "next";

// Two deploy targets:
//  • Server mode (DEFAULT) — Vercel / `next dev`. API routes run.
//  • Static export — set STATIC_EXPORT=true for GitHub Pages.
const isStaticExport = process.env.STATIC_EXPORT === "true";

const repo = "Gujju_Food";
const isProd = process.env.NODE_ENV === "production";
const basePath = isStaticExport && isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),

  basePath,
  assetPrefix: basePath,

  images: {
    unoptimized: true,
  },

  trailingSlash: isStaticExport,

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
