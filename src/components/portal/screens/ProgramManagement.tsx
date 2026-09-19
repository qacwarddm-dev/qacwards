"use client";

import { GripVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/portal/kit";
import { reassignProgramCollege, type CollegeWithPrograms } from "@/lib/admin";

type Program = CollegeWithPrograms["programs"][number];

/**
 * QAC Admin/Personnel → Program Management (2026-09-19 client meeting): drag a
 * programme card from one college column and drop it on another to re-tag its
 * college. No frame exists for this yet — the column-of-cards shape is the
 * kit's own vocabulary (`Card` + `Badge`), not a transcription.
 *
 * Optimistic: the card moves columns immediately on drop, and rolls back only
 * if `reassignProgramCollege` reports an error — a drag-and-drop screen that
 * waits on the network before moving the card reads as broken, not slow.
 */
export default function ProgramManagement({
  colleges,
}: {
  colleges: CollegeWithPrograms[];
}) {
  const [byCollege, setByCollege] = useState(() =>
    Object.fromEntries(colleges.map((c) => [c.id, c.programs])) as Record<string, Program[]>,
  );
  const [dragging, setDragging] = useState<{ program: Program; fromCollegeId: string } | null>(
    null,
  );
  const [overCollegeId, setOverCollegeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDrop(toCollegeId: string) {
    setOverCollegeId(null);
    if (!dragging || dragging.fromCollegeId === toCollegeId) {
      setDragging(null);
      return;
    }
    const { program, fromCollegeId } = dragging;
    setDragging(null);
    setError(null);

    setByCollege((prev) => ({
      ...prev,
      [fromCollegeId]: prev[fromCollegeId].filter((p) => p.id !== program.id),
      [toCollegeId]: [...prev[toCollegeId], program].sort((a, b) => a.name.localeCompare(b.name)),
    }));

    startTransition(async () => {
      const result = await reassignProgramCollege(program.id, toCollegeId);
      if (!result.ok) {
        setError(result.error);
        // Roll back — the write did not happen, so the card should not appear
        // to have moved.
        setByCollege((prev) => ({
          ...prev,
          [toCollegeId]: prev[toCollegeId].filter((p) => p.id !== program.id),
          [fromCollegeId]: [...prev[fromCollegeId], program].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        }));
      }
    });
  }

  return (
    <div>
      <p className="text-regular text-gray">
        Drag a programme onto another college to reassign it. Its accreditation
        documents and records move with it — nothing needs re-uploading.
      </p>

      {error && <p className="mt-[13px] text-regular leading-tight text-maroon">{error}</p>}

      <div className="mt-[18px] grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {colleges.map((c) => {
          const programs = byCollege[c.id] ?? [];
          const isOver = overCollegeId === c.id;
          return (
            <div
              key={c.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragging && dragging.fromCollegeId !== c.id) setOverCollegeId(c.id);
              }}
              onDragLeave={() => setOverCollegeId((v) => (v === c.id ? null : v))}
              onDrop={() => onDrop(c.id)}
              className={`flex min-h-[160px] flex-col rounded-[16px] border p-[14px] transition-colors ${
                isOver
                  ? "border-maroon bg-highlight"
                  : "border-[color:var(--color-gray)]/25 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-[8px]">
                <span className="text-regular font-bold leading-none text-black" title={c.name}>
                  {c.code}
                </span>
                <Badge tone="info">{programs.length}</Badge>
              </div>

              <div className="mt-[10px] flex flex-1 flex-col gap-[8px]">
                {programs.length === 0 && (
                  <p className="mt-[8px] text-small leading-tight text-gray">No programmes.</p>
                )}
                {programs.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDragging({ program: p, fromCollegeId: c.id });
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverCollegeId(null);
                    }}
                    aria-disabled={pending}
                    className={`flex items-center gap-[8px] rounded-[10px] border border-[color:var(--color-gray)]/20 bg-surface px-[10px] py-[8px] text-left ${
                      pending ? "opacity-60" : "cursor-grab active:cursor-grabbing"
                    }`}
                  >
                    <GripVertical
                      className="h-[14px] w-[14px] shrink-0 text-gray"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small leading-[16px] text-black">
                        {p.name}
                      </span>
                      <span className="block text-micro leading-[14px] text-gray">
                        {p.campus}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
