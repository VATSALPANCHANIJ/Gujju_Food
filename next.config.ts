  import type { NextConfig } from "next";

  // Two deploy targets:
  //  • Server mode (DEFAULT) — Vercel / `next dev`. API routes (e.g. the Supabase
  //    booking route) run. Served at the domain root, so no basePath.
  //  • Static export — set STATIC_EXPORT=true for GitHub Pages. Produces ./out
  //    under /Gujju_Food. NOTE: API routes cannot run in this mode.
  const isStaticExport = process.env.STATIC_EXPORT === "true";

  const repo = "Gujju_Food";
  const isProd = process.env.NODE_ENV === "production";
  const basePath = isStaticExport && isProd ? `/${repo}` : "";

  const nextConfig: NextConfig = {
    // Only emit a fully static site when explicitly requested.
    ...(isStaticExport ? { output: "export" as const } : {}),
    basePath,
    assetPrefix: basePath,
    // next/image optimization needs a server; harmless to keep disabled.
    images: { unoptimized: true },
    // Trailing slash only matters for static hosting; in server mode it would add
    // a 308 redirect hop on every API call.
    trailingSlash: isStaticExport,
    // Exposed to client code so manually-written public paths can be prefixed.
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath,
    },
  };

  export default nextConfig;
