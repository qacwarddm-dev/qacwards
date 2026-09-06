"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, ExpertisePicker, SectionHeading } from "@/components/portal/kit";
import { setAccreditorExpertise } from "@/lib/accreditor-actions";

/**
 * Profile → Discipline Expertise, editable by its owner — round 2 §3's first
 * entry point (QAC Admin's is the second, in `UserAccreditorEditor`).
 *
 * Personal details stay display-only per the owner's 2026-08-01 revision, and
 * specialty is deliberately not one of them: it is what an accreditor is
 * assigned *by*, it changes as they take on new fields, and §3 names them as an
 * editor of it. So it leaves the read-only panel and becomes its own card.
 *
 * Saved explicitly rather than on every chip click. Specialty is a set, and a
 * half-edited set should not be what the assignment picker ranks on.
 */
export default function ProfileSpecialtyCard({
  profileId,
  areas,
  initial,
}: {
  profileId: string;
  areas: { id: string; name: string }[];
  initial: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    selected.length !== initial.length || selected.some((id) => !initial.includes(id));

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setAccreditorExpertise(profileId, selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0 flex-1 px-[28px] pt-[19px] pb-[22px]">
      <SectionHeading icon={GraduationCap}>DISCIPLINE EXPERTISE</SectionHeading>

      <p className="mt-[13px] text-regular text-gray">
        What you can evaluate. QAC Personnel ranks accreditors by this when they
        build a team, so keeping it current is what puts you on the right
        programmes.
      </p>

      <div className="mt-[16px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[18px] pb-[20px]">
        <ExpertisePicker
          areas={areas}
          selected={selected}
          onChange={(next) => {
            setSelected(next);
            setSaved(false);
          }}
          disabled={pending}
          legend="Areas you hold"
        />
      </div>

      <div className="mt-[16px] flex items-center gap-[16px]">
        <Button variant="solid" size="md" disabled={pending || !dirty} onClick={save}>
          {pending ? "Saving…" : "Save expertise"}
        </Button>
        {error && <span className="text-regular leading-tight text-maroon">{error}</span>}
        {saved && !error && !dirty && (
          <span className="text-regular italic leading-none text-gray">Saved.</span>
        )}
      </div>
    </Card>
  );
}
