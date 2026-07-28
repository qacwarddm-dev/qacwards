import { expect, test } from "@playwright/test";
import path from "node:path";
import sharp from "sharp";
import { diffPct } from "./diff";
import { SCREENS } from "./screens";

const ROOT = path.resolve(__dirname, "../..");
const SHOTS = path.join(ROOT, "test-results", "renders");

/** The dev role switcher is a preview affordance and must not be measured. */
const HIDE_SWITCHER = "[data-dev-switcher]{display:none !important}";

test.describe("Figma frames", () => {
  for (const screen of SCREENS) {
    test(`${screen.name} matches ${path.basename(screen.frame)}`, async ({ browser }) => {
      const framePath = path.join(ROOT, screen.frame);
      const meta = await sharp(framePath).metadata();

      // Exports are 2x a 1440-wide design; render at the frame's own size so
      // landmarks compare as raw integers. Never wider than 1440 — the portal
      // shell zooms above that.
      const viewport = screen.viewport ?? {
        width: meta.width! / 2,
        height: meta.height! / 2,
      };

      const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
      const page = await context.newPage();

      try {
        const target = screen.role
          ? `/portal/dev/switch?as=${screen.role}&next=${encodeURIComponent(screen.route)}`
          : screen.route;
        const response = await page.goto(target, { waitUntil: "networkidle" });
        expect(response?.status(), `${screen.route} should render`).toBeLessThan(400);

        await page.addStyleTag({ content: HIDE_SWITCHER });

        // Lazy images below the fold stay blank unless the scroller is moved.
        await page.evaluate(async () => {
          const scroller = document.querySelector("main") ?? document.scrollingElement;
          if (!scroller) return;
          scroller.scrollTop = scroller.scrollHeight;
          await new Promise((r) => setTimeout(r, 250));
          scroller.scrollTop = 0;
        });
        await page
          .waitForFunction(
            () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
            { timeout: 10_000 }
          )
          .catch(() => {
            /* a missing image is a finding for the diff, not a harness error */
          });
        await page.waitForTimeout(250);

        const shot = path.join(SHOTS, `${screen.name.replace(/[^a-z0-9]+/gi, "-")}.png`);
        await page.screenshot({ path: shot });

        const { pct } = await diffPct(framePath, shot, {
          contentFromX: screen.contentFromX,
          band: screen.band,
        });

        // Surfaced in the report so a passing run still shows the drift.
        test.info().annotations.push({
          type: "diff",
          description: `${pct.toFixed(2)}% differing (budget ${screen.budget}%)`,
        });

        expect(
          pct,
          `${screen.name}: ${pct.toFixed(2)}% of pixels differ by >30/255 against ` +
            `${screen.frame} (budget ${screen.budget}%). Render written to ${shot}.`
        ).toBeLessThanOrEqual(screen.budget);
      } finally {
        await context.close();
      }
    });
  }
});
