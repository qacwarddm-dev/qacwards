"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "./ToastProvider";

type Res = { ok: true } | { ok: false; error: string };

export default function useAct() {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<Res>, done: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast.say(r.error, true);
      after?.();
      toast.say(done);
      router.refresh();
    });
  return { busy, run, toast };
}
