import { defineConfig } from "@playwright/test";

/**
 * Visual-regression config for the Figma frame comparison (see
 * tests/visual/README.md). These are not behaviour tests — phase 3a is static
 * UI — they assert that each screen still matches its exported frame.
 *
 * Serial on purpose: there is one dev server, and Next's image optimizer is the
 * bottleneck. Running these in parallel makes the diffs flaky, not faster.
 */
export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
