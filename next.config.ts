import type { NextConfig } from "next";

// GitHub Pages serves this project from a sub-path: /<repo-name>/
const repo = "Gujju_Food";
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  // Produce a fully static site in ./out (GitHub Pages can only serve static files)
  output: "export",
  // Serve the app and its assets under /Gujju_Food in production
  basePath,
  assetPrefix: basePath,
  // next/image optimization needs a server; disable it for static export
  images: { unoptimized: true },
  // Emit folder/index.html routes so a static host resolves them without a server
  trailingSlash: true,
  // Exposed to client code so manually-written public paths can be prefixed
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
