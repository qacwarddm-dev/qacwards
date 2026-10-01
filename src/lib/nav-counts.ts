import { createClient } from "@/lib/supabase/server";
import type { NavBadge } from "@/components/portal/portal-nav";
import type { CurrentUser } from "@/lib/current-user";

async function safeCount(q: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await q;
  return error ? 0 : (count ?? 0);
}

export async function getNavCounts(user: CurrentUser): Promise<Partial<Record<NavBadge, number>>> {
  const supabase = await createClient();
  if (user.role === "internal_accreditor") {
    const assign = await safeCount(
      supabase
        .from("assignment_accreditors")
        .select("assignment_id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("response", "pending"),
    );
    const { getResubmissionCount } = await import("@/lib/reviews");
    return { assign, resub: await getResubmissionCount(user.id) };
  }
  if (user.role === "program_representative") {
    const { getRepFeedbackCount } = await import("@/lib/reviews");
    return { fb: await getRepFeedbackCount() };
  }
  const { getQacNavCounts } = await import("@/lib/reviews");
  return getQacNavCounts();
}
