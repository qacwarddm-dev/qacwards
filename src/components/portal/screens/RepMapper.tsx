"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, DataTable, FieldLabel, SearchField } from "@/components/portal/kit";
import { attachRepToProgram, detachRepFromProgram } from "@/lib/admin";

/**
 * Attach and detach representative ↔ programme.
 *
 * The programme list runs to ~230 rows, so it is filtered rather than dumped into
 * a select — and it is filtered **client-side over an already-fetched list**,
 * which is fine at this size and deliberately not the pattern for documents or
 * submissions. Those grow without bound and get server-side search through RLS in
 * B4 (§8.2); copying this approach there would leak row counts and scan badly.
 *
 * Detaching is not cosmetic: O-15 says access follows the current mapping, so
 * removing a programme here removes that representative's access to its
 * submissions immediately, including ones they filed themselves.
 */
type Rep = { id: string; name: string; webmail: string };
type Program = { id: string; name: string; campus: string };
type Mapping = { profile_id: string; program_id: string };

const COLUMNS = [
  { key: "program", header: "Programme", width: "flex-1" },
  { key: "campus", header: "Campus", width: "w-[200px]" },
  { key: "actions", header: "", width: "w-[130px]", align: "center" as const },
];

export default function RepMapper({
  reps,
  programs,
  mappings,
}: {
  reps: Rep[];
  programs: Program[];
  mappings: Mapping[];
}) {
  const [selectedRep, setSelectedRep] = useState<string>(reps[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const held = useMemo(
    () => new Set(mappings.filter((m) => m.profile_id === selectedRep).map((m) => m.program_id)),
    [mappings, selectedRep],
  );

  const heldPrograms = programs.filter((p) => held.has(p.id));

  // Only search once the query is meaningful — an unfiltered 230-row list under
  // the table is noise, not a feature.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return programs
      .filter((p) => !held.has(p.id))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.campus.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [programs, held, query]);

  function attach(programId: string) {
    setError(null);
    startTransition(async () => {
      const result = await attachRepToProgram(selectedRep, programId);
      if (!result.ok) setError(result.error);
      else setQuery("");
    });
  }

  function detach(programId: string) {
    setError(null);
    startTransition(async () => {
      const result = await detachRepFromProgram(selectedRep, programId);
      if (!result.ok) setError(result.error);
    });
  }

  if (reps.length === 0) {
    return (
      <p className="mt-[13px] text-regular text-gray">
        No active program representatives yet. Accounts appear here once someone
        registers as an Academic Program.
      </p>
    );
  }

  return (
    <>
      <div className="mt-[13px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[17px] pb-[17px]">
        <FieldLabel>Representative</FieldLabel>
        <div className="mt-[10px] flex flex-wrap gap-[8px]">
          {reps.map((rep) => (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedRep(rep.id)}
              className={`flex h-[32px] items-center rounded-full px-[12px] text-regular leading-none ${
                rep.id === selectedRep
                  ? "bg-maroon text-white"
                  : "border border-[color:var(--color-gray)]/40 bg-white text-black"
              }`}
            >
              {rep.name}
            </button>
          ))}
        </div>

        <div className="mt-[20px]">
          <FieldLabel>Add a Programme</FieldLabel>
          <div className="mt-[10px] w-[420px]">
            <SearchField
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
              label="Search programmes"
              placeholder="Search by programme or campus…"
              className="w-full"
            />
          </div>

          {matches.length > 0 && (
            <ul className="mt-[10px] w-[420px] overflow-hidden rounded-[10px] border border-[color:var(--color-gray)]/40 bg-white">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => attach(p.id)}
                    className="flex w-full flex-col items-start px-[14px] py-[8px] text-left hover:bg-[color:var(--color-highlight)]"
                  >
                    <span className="text-regular leading-none text-black">{p.name}</span>
                    <span className="mt-[4px] text-regular leading-none text-gray">
                      {p.campus}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && matches.length === 0 && (
            <p className="mt-[10px] text-regular text-gray">
              No unassigned programme matches that.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-[13px] text-regular leading-tight text-maroon">{error}</p>
      )}

      <div className="mt-[18px]">
        {heldPrograms.length > 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={heldPrograms.map((p) => ({
              id: p.id,
              cells: {
                program: <span className="text-regular text-black">{p.name}</span>,
                campus: <span className="text-regular text-gray">{p.campus}</span>,
                actions: (
                  <span className="flex justify-center">
                    <Button
                      variant="outline"
                      size="md"
                      disabled={pending}
                      onClick={() => detach(p.id)}
                    >
                      Remove
                    </Button>
                  </span>
                ),
              },
            }))}
          />
        ) : (
          <p className="text-regular text-gray">
            This representative holds no programmes yet.
          </p>
        )}
      </div>
    </>
  );
}
