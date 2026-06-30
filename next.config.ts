import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist is a server-only Node library used by /api/extract for PDF text
  // extraction. Keep it out of the bundle so Next loads it from node_modules at
  // runtime (avoids worker/canvas bundling issues under Turbopack).
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
