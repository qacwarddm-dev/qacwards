import { NextResponse, type NextRequest } from "next/server";
import { zipSync } from "fflate";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, signedUrl, type BucketName } from "@/lib/storage";
import { CYCLE_GROUPS, type CycleFile } from "@/lib/archive-model";
import { getArchive, getCycleContents } from "@/lib/archive";

export const maxDuration = 60;

const MAX_BYTES = 200 * 1024 * 1024;
const PARALLEL = 5;

const clean = (s: string) =>
  s
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url);
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const cycleId = request.nextUrl.searchParams.get("cycle");
  const programId = request.nextUrl.searchParams.get("program");
  if (!cycleId || !programId) return NextResponse.json({ error: "Unknown program." }, { status: 400 });

  const { data: cycle } = await supabase.from("accreditation_cycles").select("id, name, closed_at").eq("id", cycleId).eq("status", "closed").maybeSingle();
  if (!cycle) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const entries = await getArchive(programId);
  const { programs } = await getCycleContents({ id: cycle.id, closedAt: cycle.closed_at }, entries, programId);
  const program = programs[0];
  const files = (program?.files ?? []).filter((f) => f.source !== "report");
  if (!program || !files.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (files.reduce((n, f) => n + (f.size ?? 0), 0) > MAX_BYTES) return NextResponse.json({ error: "These files are too large to download at once. View them one at a time." }, { status: 413 });

  const idsOf = (source: CycleFile["source"]) => files.filter((f) => f.source === source).map((f) => f.id);
  const [subs, repo] = await Promise.all([
    supabase.from("submission_documents").select("id, storage_path").in("id", idsOf("submission")),
    supabase.from("repository_files").select("id, storage_path").in("id", idsOf("repository")),
  ]);
  const located = [
    ...(subs.data ?? []).map((r) => ({ id: r.id, bucket: BUCKETS.submissions as BucketName, path: r.storage_path })),
    ...(repo.data ?? []).map((r) => ({ id: r.id, bucket: BUCKETS.repository as BucketName, path: r.storage_path })),
  ];
  const where = new Map(located.map((l) => [l.id, l]));

  const taken = new Set<string>();
  const zipped: Record<string, Uint8Array> = {};
  const queue = [...files];
  await Promise.all(
    Array.from({ length: PARALLEL }, async () => {
      for (let f = queue.shift(); f; f = queue.shift()) {
        const at = where.get(f.id);
        if (!at) continue;
        const signed = await signedUrl(supabase, at.bucket, at.path);
        const bytes = signed.data ? await fetchBytes(signed.data) : null;
        if (!bytes) continue;
        const ext = /\.[a-z0-9]{2,5}$/i.exec(at.path)?.[0] ?? "";
        const title = clean(f.name) || "file";
        const base = title.toLowerCase().endsWith(ext.toLowerCase()) ? title : `${title}${ext}`;
        const folder = f.group === "ev" ? CYCLE_GROUPS.ev : `${CYCLE_GROUPS[f.group]}/${clean(f.sub) || "Other"}`;
        let name = `${folder}/${base}`;
        for (let n = 2; taken.has(name); n++) name = `${folder}/${base.replace(/(\.[^.]*)?$/, ` (${n})$1`)}`;
        taken.add(name);
        zipped[name] = bytes;
      }
    }),
  );
  if (!Object.keys(zipped).length) return NextResponse.json({ error: "The files could not be read." }, { status: 500 });

  const fileName = `${clean(program.short)} - ${clean(cycle.name)}.zip`.replace(/[^\x20-\x7e]/g, "-");
  return new NextResponse(zipSync(zipped, { level: 0 }) as unknown as BodyInit, {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" },
  });
}
