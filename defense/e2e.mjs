import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";

const BASE = process.env.APP_URL ?? "http://127.0.0.1:3000";
const PASSWORD = process.env.DEMO_PASSWORD ?? "DefenseDemo2026!";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const API = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function as(email) {
  const c = createClient(API, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`${email}: ${error.message}`);
  return c;
}

const anon = createClient(API, ANON, { auth: { persistSession: false } });
const rep = await as("rep@pup.edu.ph");
const rep2 = await as("rep2@pup.edu.ph");
const qac = await as("qac@pup.edu.ph");
const acc = await as("accreditor@pup.edu.ph");

check("local API is used", API.startsWith("http://127.0.0.1"), API);
{
  const { data } = await anon.from("profiles").select("id").limit(5);
  check("anon cannot read profiles", !data?.length);
}
{
  const { data } = await rep.from("submissions").select("id");
  check("rep sees own program submissions", data?.length === 2, `${data?.length} rows`);
}
{
  const { data } = await rep2.from("submissions").select("id");
  check("rep2 (other campus) sees none of rep's submissions", data?.length === 0, `${data?.length} rows`);
}
{
  const { data } = await qac.from("submissions").select("id");
  check("QAC sees all submissions", (data?.length ?? 0) >= 2);
}
{
  const { data } = await acc.from("submissions").select("id");
  check("unassigned accreditor sees no submissions", data?.length === 0, `${data?.length} rows`);
}
{
  const { error } = await rep.from("accreditation_cycles").insert({ name: "x", start_date: "2026-01-01", end_date: "2026-12-31" });
  check("rep cannot create a cycle", !!error);
}
{
  const { error } = await rep.rpc("delete_accreditation", { p_submission: "00000000-0000-0000-0000-000000000000" });
  check("rep cannot call delete_accreditation", !!error, error?.message);
}

const { data: sub } = await rep.from("submissions").select("id, program_id").limit(1).single();
const { data: area } = await rep.from("requirement_areas").select("id").limit(1).single();
const { data: phaseDoc } = await rep.from("phase_documents").select("id").limit(1).single();

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const external = new Set();
page.on("request", (r) => {
  const u = new URL(r.url());
  if (u.protocol.startsWith("http") && !["127.0.0.1", "localhost"].includes(u.hostname)) external.add(u.hostname);
});

await page.goto(`${BASE}/login?as=program_representative`);
await page.fill('input[name="email"]', "rep@pup.edu.ph");
await page.fill('input[name="password"]', "wrong-password");
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
check("wrong password does not sign in", !page.url().includes("/portal"));

await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/portal/, { timeout: 30000 });
check("login works", true);

await page.goto(`${BASE}/portal/dashboard`);
await page.keyboard.press("Escape");

const pdf = await PDFDocument.create();
pdf.addPage().drawText("Defense demo document");
const bytes = Buffer.from(await pdf.save());
const up = await ctx.request.post(`${BASE}/api/submissions/upload`, {
  multipart: {
    file: { name: "demo.pdf", mimeType: "application/pdf", buffer: bytes },
    submissionId: sub.id,
    requirementAreaId: area.id,
    title: "Defense demo document",
    isDraft: "0",
  },
});
const upBody = await up.json().catch(() => ({}));
check("file upload (API route + storage)", up.ok(), `${up.status()} ${JSON.stringify(upBody).slice(0, 120)}`);

const { data: docs } = await rep.from("submission_documents").select("id, storage_path").eq("submission_id", sub.id);
check("uploaded document row exists", (docs?.length ?? 0) >= 1, `${docs?.length} rows`);
if (docs?.length) {
  const dl = await ctx.request.get(`${BASE}/api/documents/download?source=submission&id=${docs[0].id}`);
  const body = await dl.body();
  check("file download returns the PDF", dl.ok() && body.subarray(0, 4).toString() === "%PDF", `${dl.status()} ${body.length} bytes`);
  const other = await (await browser.newContext()).request.get(`${BASE}/api/documents/download?source=submission&id=${docs[0].id}`);
  check("download without a session is refused", other.status() === 401, String(other.status()));
}

await page.goto(`${BASE}/portal/dashboard`);
await page.keyboard.press("Escape");
await page.locator('text=Reyes, Marisol').first().click();
await page.locator('text=/Sign out/').first().click();
await page.waitForURL(/\/(login|$)/, { timeout: 20000 }).catch(() => {});
await page.goto(`${BASE}/portal/dashboard`);
check("logout ends the session (portal redirects to login)", page.url().includes("/login"), page.url());

await browser.close();
check("no requests left the machine", external.size === 0, [...external].join(", "));
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
