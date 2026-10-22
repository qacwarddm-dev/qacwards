import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the floating dev badge out of prototype-comparison screenshots.
  devIndicators: false,
  // Lets HMR's websocket through when the dev server is reached over LAN
  // (phone/tablet testing) instead of localhost.
  allowedDevOrigins: ["192.168.100.49"],
  // Bundled, pdfjs looks for pdf.worker.mjs beside its chunk and fails with
  // "Setting up fake worker failed" inside server actions.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Only the accreditor signature upload still posts a file to a server action.
  experimental: {
    serverActions: { bodySizeLimit: "11mb" },
    // Pages are rendered per user, so by default every click re-runs the server. Keeping a visited page for
    // 30 seconds makes going back and forth instant; saving anything (a server action or router.refresh)
    // clears it, so what is on screen never lags behind the person's own changes.
    staleTimes: { dynamic: 30, static: 180 },
  },
  outputFileTracingIncludes: {
    "/api/documents/nda-template": ["./templates/qac-nda.pdf"],
    "/api/evaluations/[id]/sheet": ["./public/assets/logos/pup.png"],
  },
};

export default nextConfig;
