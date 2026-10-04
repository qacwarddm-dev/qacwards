"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export default function useBusy() {
  const [pending, start] = useTransition();
  const [settled, setSettled] = useState(0);
  const waiting = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (pending || !waiting.current.length) return;
    const done = waiting.current;
    waiting.current = [];
    done.forEach((r) => r());
  }, [pending, settled]);

  const run = useCallback(
    (fn: () => unknown) =>
      new Promise<void>((resolve) => {
        waiting.current.push(resolve);
        start(async () => {
          try {
            await fn();
          } finally {
            setSettled((n) => n + 1);
          }
        });
      }),
    [],
  );

  return [pending, run] as const;
}
