/**
 * A small in-memory cache for data that is the same for every signed-in user (reference tables, site
 * settings). Each server instance keeps its own copy, so a change shows up here at once and elsewhere
 * within the TTL. Never cache anything that RLS filters per user: the first reader's rows would be
 * served to everyone.
 */
const store = new Map<string, { until: number; value: unknown }>();
const loading = new Map<string, Promise<unknown>>();

export async function ttlCached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  // One request loads while the rest wait on it, instead of a burst each hitting the database.
  const running = loading.get(key) as Promise<T> | undefined;
  if (running) return running;
  const next = load()
    .then((value) => {
      store.set(key, { until: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => loading.delete(key));
  loading.set(key, next);
  return next;
}

/** Drops every entry whose key starts with `prefix`; call it after the data changes. */
export function bustCache(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
