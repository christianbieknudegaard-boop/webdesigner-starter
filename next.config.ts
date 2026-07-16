import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // The app is fully client-side, so it ships as a static export that can be
  // hosted anywhere (GitHub Pages, Vercel, any static file server).
  output: "export",
  // On GitHub Pages the site lives under /<repo-name>; the deploy workflow
  // sets NEXT_PUBLIC_BASE_PATH accordingly. Empty for local/dev builds.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
