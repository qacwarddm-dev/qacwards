"use client";

import { useEffect, useState } from "react";
import { matchDocumentText, type TextKind } from "@/lib/search-actions";

const NONE = new Set<string>();

/** File ids whose text matches `q`, for search boxes that otherwise filter by
 *  name only. `pending` is true until the answer for the current `q` arrives. */
export default function useContentMatches(kinds: TextKind[], q: string): { ids: Set<string>; pending: boolean } {
  const term = q.trim();
  const key = kinds.join(",");
  const [hit, setHit] = useState<{ term: string; ids: Set<string> }>({ term: "", ids: NONE });

  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      matchDocumentText(key.split(",") as TextKind[], term)
        .then((ids) => live && setHit({ term, ids: new Set(ids) }))
        .catch(() => live && setHit({ term, ids: NONE }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [key, term]);

  if (term.length < 2) return { ids: NONE, pending: false };
  return hit.term === term ? { ids: hit.ids, pending: false } : { ids: NONE, pending: true };
}
