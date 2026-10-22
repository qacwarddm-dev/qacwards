import { chromium } from "@playwright/test";

const BASE = process.env.APP_URL ?? "http://127.0.0.1:3000";
const PASSWORD = process.env.DEMO_PASSWORD ?? "DefenseDemo2026!";
const ACCOUNTS = [
  ["admin@pup.edu.ph", "QAC Admin", "qac_personnel"],
  ["qac@pup.edu.ph", "QAC Personnel", "qac_personnel"],
  ["rep@pup.edu.ph", "Representative", "program_representative"],
  ["accreditor@pup.edu.ph", "Accreditor", "internal_accreditor"],
];

const external = new Set();
const results = [];
const browser = await chromium.launch();

for (const [email, label, as] of ACCOUNTS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname) && u.protocol.startsWith("http")) external.add(`${u.hostname} (${label})`);
  });
  await page.goto(`${BASE}/login?as=${as}`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/portal/, { timeout: 30000 });
  await page.keyboard.press("Escape");
  const pages = {};
  for (const p of ["dashboard", "submission", "assignment", "documents", "reports", "events"]) {
    const res = await page.goto(`${BASE}/portal/${p}`, { waitUntil: "networkidle" });
    pages[p] = res?.status();
  }
  await page.goto(`${BASE}/portal/dashboard`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.shots/defense/${label.replace(/\s/g, "-")}.png` });
  results.push({ email, landed: page.url().replace(BASE, ""), pages });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 1));
console.log("external hosts contacted:", external.size ? [...external] : "none");
