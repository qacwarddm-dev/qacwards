"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const STEPS: [number, number][] = [
  [0, 0.35],
  [500, 0.7],
  [1100, 0.88],
];
const FAILSAFE_MS = 10000;

export default function TopLine() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const bar = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const finish = useCallback(() => {
    const el = bar.current;
    if (!el || !running.current) return;
    running.current = false;
    clear();
    el.style.transform = "scaleX(1)";
    timers.current.push(setTimeout(() => (el.style.opacity = "0"), 300));
  }, []);

  const start = useCallback(() => {
    const el = bar.current;
    if (!el || running.current) return;
    running.current = true;
    clear();
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform = "scaleX(0)";
    requestAnimationFrame(() => {
      el.style.transition = "";
      STEPS.forEach(([at, to]) => timers.current.push(setTimeout(() => (el.style.transform = `scaleX(${to})`), at)));
      timers.current.push(setTimeout(finish, FAILSAFE_MS));
    });
  }, [finish]);

  useEffect(() => {
    finish();
  }, [pathname, search, finish]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clear();
    };
  }, [start]);

  return <div ref={bar} className="q-top" aria-hidden />;
}
