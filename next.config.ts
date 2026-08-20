import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the floating dev badge out of prototype-comparison screenshots.
  devIndicators: false,
  // Lets HMR's websocket through when the dev server is reached over LAN
  // (phone/tablet testing) instead of localhost.
  allowedDevOrigins: ["192.168.100.49"],
  // `/portal/settings` -> `/portal/settings/cycles` used to be a page
  // component whose entire body was `redirect()`. Next 16's dev-mode RSC
  // performance instrumentation throws `cannot have a negative time stamp`
  // on a component that renders nothing and returns in ~0ms (framework bug,
  // dev-overlay only — the production build was never affected). A
  // config-level redirect resolves the route before React ever renders it,
  // which sidesteps the instrumentation entirely instead of working around it.
  async redirects() {
    return [
      {
        source: "/portal/settings",
        destination: "/portal/settings/cycles",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
