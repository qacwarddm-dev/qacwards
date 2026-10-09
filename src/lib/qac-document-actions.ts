"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { BUCKETS, checkUploaded } from "@/lib/storage";
import { indexDocument } from "@/lib/doc-index";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX = 25 * 1024 * 1024;
const GROUPS = ["areas", "l3", "l4", "gen"];

function refresh() {
  for (const p of ["/portal/documents", "/portal/submission", "/portal/dashboard"]) revalidatePath(p);
}

async function qac() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "qac_personnel" && user.role !== "qac_admin")) return null;
  return user;
}

async function notifyReps(title: string, link: string, colleges: string[] = []) {
  const supabase = await createClient();
  const { data } = await supabase.from("program_reps").select("profile_id, profiles(colleges(code))");
  const rows = (data ?? []).filter((r) => {
    const code = (r.profiles as { colleges: { code: string } | null } | null)?.colleges?.code;
    return !colleges.length || (code !== undefined && colleges.includes(code));
  });
  const ids = [...new Set(rows.map((r) => r.profile_id))];
  await Promise.all(ids.map((id) => supabase.rpc("send_reminder", { p_profile: id, p_title: title, p_link: link })));
}

export async function saveTemplate(fd: FormData): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can manage templates." };
  const path = String(fd.get("path") ?? "");
  const fileName = String(fd.get("fileName") ?? "");
  const id = String(fd.get("id") ?? "") || null;
  const areaId = String(fd.get("areaId") ?? "") || null;
  const levelId = String(fd.get("levelId") ?? "") || null;
  const group = String(fd.get("group") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const note = String(fd.get("note") ?? "").trim() || null;
  const publish = fd.get("publish") === "1";
  const notify = fd.get("notify") === "1";
  if (!GROUPS.includes(group)) return { ok: false, error: "Unknown template group." };
  if (!id && !title) return { ok: false, error: "Enter what the template is for" };

  const supabase = await createClient();
  const up = await checkUploaded(supabase, BUCKETS.templates, { path, prefix: `${group}/`, name: fileName, exts: [".docx"], max: MAX });
  if ("error" in up) return { ok: false, error: up.error };

  if (id) {
    const { data: cur } = await supabase.from("templates").select("title, version, storage_path, uploaded_by, is_published").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, error: "That template no longer exists." };
    const { error: hErr } = await supabase
      .from("template_versions")
      .insert({ template_id: id, version: cur.version, storage_path: cur.storage_path, file_name: cur.storage_path.split("/").pop() ?? "", uploaded_by: cur.uploaded_by });
    if (hErr) return { ok: false, error: hErr.message };
    const { error } = await supabase
      .from("templates")
      .update({ storage_path: path, content_text: null, version: cur.version + 1, change_note: note, uploaded_by: user.id, updated_at: new Date().toISOString(), is_published: publish || cur.is_published })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    after(() => indexDocument(supabase, "template", id));
    if (notify) await notifyReps(`Template updated: ${cur.title} (v${cur.version + 1})`, "/portal/documents");
  } else {
    if (!areaId) {
      const { data: dup } = await supabase.from("templates").select("id").eq("group_key", group).ilike("title", title).limit(1);
      if (dup?.length) return { ok: false, error: "A template for this already exists. Use Replace instead." };
    }
    const { data: created, error } = await supabase
      .from("templates")
      .insert({
        title,
        storage_path: path,
        requirement_area_id: areaId,
        level_id: levelId,
        group_key: group,
        is_published: publish,
        uploaded_by: user.id,
      })
      .select("id")
      .single();
    if (error) {
      await supabase.storage.from(BUCKETS.templates).remove([path]);
      return { ok: false, error: error.message };
    }
    after(() => indexDocument(supabase, "template", created.id));
    if (notify && publish) await notifyReps(`New template: ${title}`, "/portal/documents");
  }
  refresh();
  return { ok: true };
}

export async function restoreTemplateVersion(versionId: string): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can manage templates." };
  const supabase = await createClient();
  const { data: v } = await supabase.from("template_versions").select("template_id, version, storage_path").eq("id", versionId).maybeSingle();
  if (!v) return { ok: false, error: "That version no longer exists." };
  const { data: cur } = await supabase.from("templates").select("version, storage_path, uploaded_by").eq("id", v.template_id).maybeSingle();
  if (!cur) return { ok: false, error: "That template no longer exists." };
  const { error: hErr } = await supabase
    .from("template_versions")
    .insert({ template_id: v.template_id, version: cur.version, storage_path: cur.storage_path, file_name: cur.storage_path.split("/").pop() ?? "", uploaded_by: cur.uploaded_by });
  if (hErr) return { ok: false, error: hErr.message };
  const { error } = await supabase
    .from("templates")
    .update({ storage_path: v.storage_path, content_text: null, version: cur.version + 1, change_note: `Restored v${v.version}`, uploaded_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", v.template_id);
  if (error) return { ok: false, error: error.message };
  after(() => indexDocument(supabase, "template", v.template_id));
  refresh();
  return { ok: true };
}

export async function setTemplatePublished(id: string, published: boolean): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can manage templates." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").update({ is_published: published }).eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That template could not be updated." };
  refresh();
  return { ok: true };
}

export async function saveCommonDoc(fd: FormData): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can manage common documents." };
  const path = String(fd.get("path") ?? "");
  const fileName = String(fd.get("fileName") ?? "");
  const id = String(fd.get("id") ?? "") || null;
  const title = String(fd.get("title") ?? "").trim();
  const category = String(fd.get("category") ?? "Institutional");
  const visibleTo = String(fd.get("visibleTo") ?? "All program reps");
  const collegeCodes = String(fd.get("colleges") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  if (!title) return { ok: false, error: "Enter a title" };

  const supabase = await createClient();
  const up = await checkUploaded(supabase, BUCKETS.commonDocs, { path, prefix: "", name: fileName, exts: [".pdf"], max: MAX });
  if ("error" in up) return { ok: false, error: up.error };

  const row = { title, category, visible_to: visibleTo, college_codes: collegeCodes, storage_path: path, content_text: null, file_size: up.size, uploaded_by: user.id, updated_at: new Date().toISOString() };
  if (id) {
    const { data: old } = await supabase.from("common_documents").select("storage_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("common_documents").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (old) await supabase.storage.from(BUCKETS.commonDocs).remove([old.storage_path]);
    after(() => indexDocument(supabase, "common", id));
  } else {
    const { data: created, error } = await supabase.from("common_documents").insert(row).select("id").single();
    if (error) {
      await supabase.storage.from(BUCKETS.commonDocs).remove([path]);
      return { ok: false, error: error.message };
    }
    after(() => indexDocument(supabase, "common", created.id));
  }
  if (fd.get("notify") === "1") await notifyReps(`${id ? "Updated" : "New"} common document: ${title}`, "/portal/documents?tab=common", collegeCodes);
  refresh();
  return { ok: true };
}

export async function deleteCommonDoc(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can manage common documents." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("common_documents").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That document could not be deleted." };
  refresh();
  return { ok: true };
}

export async function restoreCommonDoc(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can manage common documents." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("common_documents").update({ deleted_at: null }).eq("id", id).not("deleted_at", "is", null).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That document could not be restored." };
  refresh();
  return { ok: true };
}

export async function purgeCommonDoc(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can manage common documents." };
  const supabase = await createClient();
  const { data: doc } = await supabase.from("common_documents").select("storage_path").eq("id", id).not("deleted_at", "is", null).maybeSingle();
  if (!doc) return { ok: false, error: "That document is no longer in Recently Deleted." };
  const { error } = await supabase.from("common_documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.storage.from(BUCKETS.commonDocs).remove([doc.storage_path]);
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function reviewNda(profileId: string, ok: boolean, note: string): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can verify NDAs." };
  if (!ok && !note.trim()) return { ok: false, error: "Add a remark so the program rep knows what to fix" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ndas")
    .update({ status: ok ? "verified" : "returned", review_note: ok ? null : note.trim(), reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("status", "review")
    .select("profile_id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "This NDA was already reviewed." };
  await supabase.rpc("send_reminder", {
    p_profile: profileId,
    p_title: ok ? "Your NDA was verified. Common Documents are now open." : `Your NDA was returned: ${note.trim()}`,
    p_link: "/portal/documents?tab=common",
  });
  refresh();
  revalidatePath("/portal/documents");
  return { ok: true };
}

export async function replaceNdaForm(fd: FormData): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can replace the NDA form." };
  const path = String(fd.get("path") ?? "");
  const supabase = await createClient();
  const up = await checkUploaded(supabase, BUCKETS.templates, { path, prefix: "nda/", name: String(fd.get("fileName") ?? ""), exts: [".pdf"], max: MAX });
  if ("error" in up) return { ok: false, error: up.error };
  const { data: cur } = await supabase.from("templates").select("id, version, storage_path, uploaded_by").eq("group_key", "nda").maybeSingle();
  if (cur) {
    await supabase
      .from("template_versions")
      .insert({ template_id: cur.id, version: cur.version, storage_path: cur.storage_path, file_name: cur.storage_path.split("/").pop() ?? "", uploaded_by: cur.uploaded_by });
    const { error } = await supabase
      .from("templates")
      .update({ storage_path: path, version: cur.version + 1, uploaded_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", cur.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("templates").insert({ title: "NDA Form", storage_path: path, group_key: "nda", version: 2, is_published: true, uploaded_by: user.id });
    if (error) return { ok: false, error: error.message };
  }
  refresh();
  return { ok: true };
}
