import { NextResponse } from "next/server";
import { createJobClient, cronAuthorized } from "@/lib/supabase/mailer";
import { indexPending } from "@/lib/doc-index";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { client, error: authError } = await createJobClient();
  if (!client) {
    return NextResponse.json({ error: authError }, { status: 500 });
  }

  try {
    return NextResponse.json(await indexPending(client, 50_000));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}

export const GET = run;
export const POST = run;
