import { createJobClient } from "@/lib/supabase/mailer";
import { drainEmailOutbox } from "@/lib/mailer-drain";

const MIN_GAP_MS = 20_000;

let lastRun = 0;
let running = false;

export async function flushEmailOutbox(): Promise<void> {
  const now = Date.now();
  if (running || now - lastRun < MIN_GAP_MS) return;
  running = true;
  lastRun = now;

  try {
    const { client, error } = await createJobClient();
    if (!client) {
      console.error("email flush: " + error);
      return;
    }
    try {
      await drainEmailOutbox(client);
    } finally {
      await client.auth.signOut({ scope: "local" });
    }
  } catch (err) {
    console.error("email flush failed:", err);
  } finally {
    running = false;
  }
}
