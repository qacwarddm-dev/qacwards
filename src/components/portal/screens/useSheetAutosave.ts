"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSheet, saveSheetFields } from "@/lib/assignment-actions";

const SAVE_DELAY_MS = 700;
/** Both accreditors fill the same sheet (spec p.3); this is how often one sees
 *  the other's typing land. */
const POLL_MS = 5000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSheetAutosave(
  assignmentId: string,
  initial: Record<string, string>,
  { poll = true, readOnly = false } = {},
) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  const pending = useRef<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current) await inFlight.current;
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    setStatus("saving");
    inFlight.current = (async () => {
      const result = await saveSheetFields(assignmentId, patch);
      if (result.ok) {
        setStatus("saved");
        setError(null);
      } else {
        pending.current = { ...patch, ...pending.current };
        setStatus("error");
        setError(result.error);
      }
    })();
    await inFlight.current;
    inFlight.current = null;
  }, [assignmentId]);

  const setValue = useCallback(
    (key: string, value: string) => {
      if (readOnly) return;
      setValues((v) => ({ ...v, [key]: value }));
      pending.current[key] = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush, readOnly],
  );

  useEffect(() => {
    if (!poll || readOnly) return;
    const id = setInterval(async () => {
      if (document.hidden) return;
      const remote = await fetchSheet(assignmentId);
      setLastEditor(remote.updatedBy);
      setValues((local) => {
        const merged = { ...local };
        for (const [k, v] of Object.entries(remote.values)) {
          if (!(k in pending.current)) merged[k] = v;
        }
        return merged;
      });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [assignmentId, poll, readOnly]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      void flush();
    };
  }, [flush]);

  return { values, setValue, flush, status, error, lastEditor };
}
