"use client";

import { useRouter } from "next/navigation";
import useBusy from "./useBusy";
import { useToast } from "./ToastProvider";

type Res = { ok: true; notice?: string } | { ok: false; error: string };

export default function useAct() {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useBusy();
  const run = (fn: () => Promise<Res>, done: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast.say(r.error, true);
      after?.();
      toast.say(r.notice ? `${done} ${r.notice}` : done);
      router.refresh();
    });
  return { busy, run, toast };
}
