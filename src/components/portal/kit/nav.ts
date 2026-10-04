"use client";

import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

export const NAV_START = "q:navstart";

let navigating = false;
const subs = new Set<() => void>();

export function setNavigating(v: boolean) {
  if (navigating === v) return;
  navigating = v;
  subs.forEach((f) => f());
}

export function useNavigating() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => navigating,
    () => false,
  );
}

export function isPageNav(url: URL) {
  return url.origin === location.origin && !url.pathname.startsWith("/api/") && !/\.\w+$/.test(url.pathname) && (url.pathname !== location.pathname || url.search !== location.search);
}

export function startNav(href?: string) {
  if (href && !isPageNav(new URL(href, location.href))) return;
  window.dispatchEvent(new Event(NAV_START));
}

export default function useNav() {
  const router = useRouter();
  return useMemo(
    () => ({
      push: (href: string, opts?: { scroll?: boolean }) => {
        startNav(href);
        router.push(href, opts);
      },
      replace: (href: string, opts?: { scroll?: boolean }) => {
        startNav(href);
        router.replace(href, opts);
      },
      back: () => {
        startNav();
        router.back();
      },
      refresh: router.refresh,
      prefetch: router.prefetch,
    }),
    [router],
  );
}
