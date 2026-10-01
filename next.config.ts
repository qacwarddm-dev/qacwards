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
  // The rep NDA upload still posts the file to a server action so it can be scanned.
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  outputFileTracingIncludes: {
    "/api/documents/nda-template": ["./templates/qac-nda.pdf"],
    "/api/evaluations/[id]/sheet": ["./public/assets/logos/pup.png"],
  },
};

export default nextConfig;
