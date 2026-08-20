import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The one place uploads and downloads touch object storage.
 *
 * Every bucket call in the app goes through here rather than calling
 * `supabase.storage.from(...)` at each site. Supabase Storage is S3-compatible,
 * so if the free tier ever binds, moving documents to Cloudflare R2 becomes a
 * driver swap inside this module instead of a migration touching every upload
 * route (plans/BACKEND.md §8.1b). It is about forty lines of insurance.
 *
 * **Every bucket is private.** Reads are short-lived signed URLs minted
 * server-side *after* an RLS check, never public URLs — a public URL is an
 * unauthenticated, permanent, un-revocable link to an accreditation document.
 */

export const BUCKETS = {
  submissions: "submissions",
  repository: "repository",
  templates: "templates",
  commonDocs: "common-docs",
  ndas: "ndas",
  avatars: "avatars",
  reports: "reports",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Signed URLs live one minute — long enough to redirect a browser at the file,
 *  short enough that a leaked link is worthless by the time it is shared. */
const SIGNED_URL_TTL_SECONDS = 60;

export type StorageResult<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Upload, replacing any file already at that path.
 *
 * `upsert` is on deliberately for the paths that are keyed by owner (an avatar is
 * `{profile_id}/avatar.ext` and replacing it is the whole point). Document
 * buckets must NOT reuse a path — the revision loop in §2.3 supersedes rows
 * rather than overwriting files — so callers there pass a fresh path per version.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: BucketName,
  path: string,
  file: File | Blob | ArrayBuffer | Uint8Array,
  options?: { contentType?: string; upsert?: boolean },
): Promise<StorageResult<{ path: string }>> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) return { data: null, error: error.message };
  return { data: { path: data.path }, error: null };
}

/** A short-lived URL for a private object. Call only after an RLS-backed read. */
export async function signedUrl(
  supabase: SupabaseClient,
  bucket: BucketName,
  path: string,
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<StorageResult<string>> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return { data: null, error: error.message };
  return { data: data.signedUrl, error: null };
}

export async function removeFile(
  supabase: SupabaseClient,
  bucket: BucketName,
  path: string,
): Promise<StorageResult<true>> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}

/**
 * Where a user's avatar lives. Keyed by profile id so the storage policy is a
 * path-prefix comparison against `auth.uid()` and nobody can write into anyone
 * else's folder.
 */
export function avatarPath(profileId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${profileId}/avatar.${ext}`;
}
