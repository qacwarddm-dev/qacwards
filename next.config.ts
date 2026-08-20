import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the floating dev badge out of prototype-comparison screenshots.
  devIndicators: false,
  // Lets HMR's websocket through when the dev server is reached over LAN
  // (phone/tablet testing) instead of localhost.
  allowedDevOrigins: ["192.168.100.49"],
};

export default nextConfig;
