"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setSiteVisitDate } from "@/lib/assignment-actions";
import { useToast } from "../kit";

export default function SiteVisitDateEditor({
  assignmentId,
  value,
}: {
  assignmentId: string;
  value: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [date, setDate] = useState(value ?? "");
  const [pending, startTransition] = useTransition();

  function save(next: string) {
    setDate(next);
    startTransition(async () => {
      const result = await setSiteVisitDate(assignmentId, next || null);
      if (!result.ok) {
        toast.push({ tone: "error", title: result.error });
        setDate(value ?? "");
        return;
      }
      toast.push({ tone: "success", title: next ? "Site visit date set." : "Site visit date cleared." });
      router.refresh();
    });
  }

  return (
    <label className="flex flex-col items-center gap-[4px] text-small leading-none text-gray">
      Site visit
      <input
        type="date"
        aria-label="Site visit date"
        value={date}
        disabled={pending}
        onChange={(e) => save(e.target.value)}
        className="h-[26px] rounded-[6px] border border-[color:var(--color-gray)]/50 bg-transparent px-[6px] text-small text-black outline-none focus-visible:outline-2 focus-visible:outline-maroon disabled:opacity-50"
      />
    </label>
  );
}
