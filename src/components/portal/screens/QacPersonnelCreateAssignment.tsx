"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignmentForProgramLevel, fetchEligibleAccreditors } from "@/lib/assignment-actions";
import type { EligibleAccreditor } from "@/lib/assignments";
import {
  BackLink,
  Button,
  Card,
  type Column,
  DataTable,
  FieldLabel,
  PanelHeader,
  SelectInput,
} from "../kit";

/** assets/FIGMA/qac_personnel/03.1-Create new assignment.png */
const COLUMNS: Column[] = [
  { key: "name", header: "Name", width: "w-[248px]" },
  { key: "expertise", header: "Expertise", width: "flex-1" },
  { key: "action", header: "Action", width: "w-[200px]" },
];

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
 * The frame has no due-date field, so `createAssignmentForProgramLevel` is
 * called with a null one — nothing here invents UI the Figma export doesn't
 * draw.
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

  const defaultLevel = levels.find((l) => l.code === "IV")?.id ?? levels[0]?.id ?? "";
  const [levelId, setLevelId] = useState(defaultLevel);

  const [accreditors, setAccreditors] = useState<EligibleAccreditor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
      const result = await createAssignmentForProgramLevel(programId, levelId, [...selected]);
      if (!result.ok) setError(result.error);
      else router.push("/portal/assignment");
    });
  }

  const rows = accreditors.map((a) => ({
    id: a.id,
    cells: {
      name: <span className="text-gray">{a.name}</span>,
      expertise: (
        <span className="text-gray">
          {a.matched.length > 0 ? a.matched.join(", ") : "No matching expertise on file"}
        </span>
      ),
      action: (
        <span className="flex justify-center">
          <Button
            variant={selected.has(a.id) ? "solid" : "outline"}
            disabled={pending}
            onClick={() => toggle(a.id)}
          >
            {selected.has(a.id) ? "Selected" : "Assign"}
          </Button>
        </span>
      ),
    },
  }));

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
          </div>
        </Card>

        {/* Eligible accreditors */}
        <Card variant="outline" radius={16} className="mt-[24px] px-[44px] pb-[18px] pt-[24px]">
          <h2 className="text-subheading font-semibold leading-none text-black">
            Eligible Accreditors
          </h2>
          <div className="mt-[18px]">
            {rows.length > 0 ? (
              <DataTable columns={COLUMNS} rows={rows} bodyRowH="h-[47px]" />
            ) : (
              <p className="py-[20px] text-regular text-gray">
                No active internal accreditors on file yet.
              </p>
            )}
          </div>
        </Card>

        {error && <p className="mt-[18px] text-regular leading-tight text-maroon">{error}</p>}

        <div className="mt-[38px] flex justify-end">
          <Button variant="solid" disabled={pending || selected.size === 0} onClick={submit}>
            Create Assignment
          </Button>
        </div>
      </Card>
    </div>
  );
}
