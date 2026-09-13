"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignmentForProgramLevel, fetchEligibleAccreditors } from "@/lib/assignment-actions";
import type { EligibleAccreditor } from "@/lib/assignments";
import {
  AccreditorPicker,
  BackLink,
  Button,
  Card,
  FieldLabel,
  PanelHeader,
  SelectInput,
} from "../kit";

type Campus = { id: string; name: string };
type College = { id: string; name: string };
type Program = { id: string; name: string; campusId: string; collegeId: string | null };
type Level = { id: string; code: string; name: string };

/**
 * B9's fetching half: the picker's own lists (campus/college/programme) are
 * loaded once by `/portal/assignment/new/page.tsx` and filtered client-side
 * (§ RepMapper's reasoning — a few hundred rows, cheap in the browser).
 * Eligible accreditors are the one selection-dependent piece, so they are
 * re-fetched by a server action as the programme changes rather than bulk-
 * loaded for all programmes up front.
 *
 * The frame had no due-date field; one was added per the client's 2026-09-06
 * confirmation that QAC sets a deadline per assignment, which now also shows
 * up on the calendar (`getMonthEvents`, `src/lib/events.ts`).
 */
export default function QacPersonnelCreateAssignment({
  campuses,
  colleges,
  programs,
  levels,
}: {
  campuses: Campus[];
  colleges: College[];
  programs: Program[];
  levels: Level[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultCampus =
    campuses.find((c) => c.name === "Sta. Mesa, Manila")?.id ?? campuses[0]?.id ?? "";
  const [campusId, setCampusId] = useState(defaultCampus);

  const collegesOnCampus = useMemo(
    () => colleges.filter((c) => programs.some((p) => p.campusId === campusId && p.collegeId === c.id)),
    [colleges, programs, campusId],
  );
  const [collegeId, setCollegeId] = useState(collegesOnCampus[0]?.id ?? "");

  // Every reset below is adjusted during render rather than in an effect —
  // React re-renders once more before painting instead of committing a stale
  // pick first and correcting it a frame later (a satellite campus has no
  // colleges of its own, O-1 / decision 6, so this genuinely changes output).
  const [prevCampusId, setPrevCampusId] = useState(campusId);
  if (campusId !== prevCampusId) {
    setPrevCampusId(campusId);
    setCollegeId(collegesOnCampus[0]?.id ?? "");
  }

  const programsAvailable = useMemo(
    () =>
      programs.filter(
        (p) => p.campusId === campusId && (collegeId ? p.collegeId === collegeId : true),
      ),
    [programs, campusId, collegeId],
  );
  const [programId, setProgramId] = useState(programsAvailable[0]?.id ?? "");

  const programsKey = `${campusId}|${collegeId}`;
  const [prevProgramsKey, setPrevProgramsKey] = useState(programsKey);
  if (programsKey !== prevProgramsKey) {
    setPrevProgramsKey(programsKey);
    setProgramId(programsAvailable[0]?.id ?? "");
  }

  const defaultLevel = levels[0]?.id ?? "";
  const [levelId, setLevelId] = useState(defaultLevel);

  const [accreditors, setAccreditors] = useState<EligibleAccreditor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState("");

  const [prevProgramId, setPrevProgramId] = useState(programId);
  if (programId !== prevProgramId) {
    setPrevProgramId(programId);
    setSelected(new Set());
    setAccreditors([]);
  }

  useEffect(() => {
    if (!programId) return; // nothing to fetch; already cleared above
    let cancelled = false;
    fetchEligibleAccreditors(programId).then((rows) => {
      if (!cancelled) setAccreditors(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (!programId || !levelId) return;
    startTransition(async () => {
      const result = await createAssignmentForProgramLevel(
        programId,
        levelId,
        [...selected],
        dueDate || null,
      );
      if (!result.ok) setError(result.error);
      else router.push("/portal/assignment");
    });
  }

  return (
    <div className="px-[57px] pb-[45px] pt-[32px]">
      <Card className="px-[44.5px] pb-[22px] pt-[28px]">
        <PanelHeader
          title="Accreditation Assignment"
          action={<BackLink href="/portal/assignment" />}
        />

        {/* Selection form */}
        <Card variant="outline" radius={16} className="mt-[19px] px-[44px] pb-[33px] pt-[26px]">
          <div className="grid grid-cols-2 gap-x-[60px] gap-y-[27px]">
            <div>
              <FieldLabel>Campus</FieldLabel>
              <div className="mt-[13px]">
                <SelectInput
                  label="Campus"
                  options={campuses.map((c) => c.name)}
                  defaultValue={campuses.find((c) => c.id === campusId)?.name}
                  onSelect={(name) => setCampusId(campuses.find((c) => c.name === name)?.id ?? "")}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <div className="mt-[13px]">
                {collegesOnCampus.length > 0 ? (
                  <SelectInput
                    label="Department"
                    options={collegesOnCampus.map((c) => c.name)}
                    defaultValue={collegesOnCampus.find((c) => c.id === collegeId)?.name}
                    onSelect={(name) =>
                      setCollegeId(collegesOnCampus.find((c) => c.name === name)?.id ?? "")
                    }
                  />
                ) : (
                  <SelectInput label="Department" value="No departments on this campus" />
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Program</FieldLabel>
              <div className="mt-[13px]">
                {programsAvailable.length > 0 ? (
                  <SelectInput
                    label="Program"
                    options={programsAvailable.map((p) => p.name)}
                    defaultValue={programsAvailable.find((p) => p.id === programId)?.name}
                    onSelect={(name) =>
                      setProgramId(programsAvailable.find((p) => p.name === name)?.id ?? "")
                    }
                  />
                ) : (
                  <SelectInput label="Program" value="No programmes here" />
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Level</FieldLabel>
              <div className="mt-[13px]">
                <SelectInput
                  label="Level"
                  options={levels.map((l) => l.code)}
                  defaultValue={levels.find((l) => l.id === levelId)?.code}
                  onSelect={(code) => setLevelId(levels.find((l) => l.code === code)?.id ?? "")}
                />
              </div>
            </div>
            <div>
              <FieldLabel note="Optional">Deadline</FieldLabel>
              <div className="mt-[13px]">
                <input
                  type="date"
                  aria-label="Deadline"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-[40px] w-full rounded-[10px] border border-[color:var(--color-gray)]/50 bg-transparent px-[22px] text-regular leading-none text-black outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Eligible accreditors */}
        <Card variant="outline" radius={16} className="mt-[24px] px-[44px] pb-[18px] pt-[24px]">
          <h2 className="text-subheading font-semibold leading-none text-black">
            Eligible Accreditors
          </h2>
          <p className="mt-[6px] text-small leading-tight text-black/70">
            Select exactly 2 ({selected.size}/2 selected).
          </p>
          <div className="mt-[18px]">
            <AccreditorPicker
              accreditors={accreditors}
              selected={selected}
              onToggle={toggle}
              disabled={pending}
            />
          </div>
        </Card>

        {error && <p className="mt-[18px] text-regular leading-tight text-maroon">{error}</p>}

        <div className="mt-[38px] flex justify-end">
          <Button variant="solid" disabled={pending || selected.size !== 2} onClick={submit}>
            Create Assignment
          </Button>
        </div>
      </Card>
    </div>
  );
}
