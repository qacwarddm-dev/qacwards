"use client";

import { useState, useTransition } from "react";
import { Button, DataTable, FieldLabel, TextInput } from "@/components/portal/kit";
import { createCycle, setCycleStatus } from "@/lib/admin";
import type { CycleStatus } from "@/lib/database.types";

/**
 * Create a cycle, and open or close the ones that exist.
 *
 * "Open" is the consequential control on this screen: only one cycle may be open
 * at a time (a partial unique index enforces it), and the open one is the window
 * representatives file into. Closing is O-14's freeze — the work stays visible as
 * history, uploads stop.
 */
type Cycle = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: CycleStatus;
};

const COLUMNS = [
  { key: "name", header: "Cycle", width: "flex-1" },
  { key: "dates", header: "Window", width: "w-[220px]" },
  { key: "status", header: "Status", width: "w-[110px]" },
  { key: "actions", header: "", width: "w-[190px]", align: "center" as const },
];

/** Dates are stored as `date`, so they carry no zone and must not be run through
 *  a zone conversion on the way out — §8.4 is about timestamps, not these. */
function windowLabel(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

const STATUS_TEXT: Record<CycleStatus, string> = {
  draft: "text-gray",
  open: "text-[color:var(--color-approved)]",
  closed: "text-maroon",
};

export default function CycleManager({ cycles }: { cycles: Cycle[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCycle(formData);
      if (!result.ok) setError(result.error);
      else setShowForm(false);
    });
  }

  function changeStatus(id: string, status: CycleStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setCycleStatus(id, status);
      if (!result.ok) setError(result.error);
    });
  }

  const rows = cycles.map((cycle) => ({
    id: cycle.id,
    cells: {
      name: (
        <span className="flex flex-col">
          <span className="text-subheading leading-none text-black">{cycle.name}</span>
          {cycle.description && (
            <span className="mt-[4px] text-regular leading-none text-gray">
              {cycle.description}
            </span>
          )}
        </span>
      ),
      dates: (
        <span className="text-regular text-gray">
          {windowLabel(cycle.start_date, cycle.end_date)}
        </span>
      ),
      status: (
        <span className={`text-regular font-semibold ${STATUS_TEXT[cycle.status]}`}>
          {cycle.status[0].toUpperCase() + cycle.status.slice(1)}
        </span>
      ),
      actions: (
        <span className="flex justify-center gap-[6px]">
          {cycle.status !== "open" && cycle.status !== "closed" && (
            <Button
              variant="solid"
              size="md"
              disabled={pending}
              onClick={() => changeStatus(cycle.id, "open")}
            >
              Open
            </Button>
          )}
          {cycle.status === "open" && (
            <Button
              variant="outline"
              size="md"
              disabled={pending}
              onClick={() => changeStatus(cycle.id, "closed")}
            >
              Close
            </Button>
          )}
          {cycle.status === "closed" && (
            <span className="text-regular italic text-gray">Frozen</span>
          )}
        </span>
      ),
    },
  }));

  return (
    <>
      <div className="mt-[13px] flex items-center justify-between">
        <p className="text-regular text-gray">
          One cycle may be open at a time. Closing a cycle freezes its submissions
          as read-only history.
        </p>
        <Button variant="solid" size="md" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "New Cycle"}
        </Button>
      </div>

      {showForm && (
        <form
          action={submit}
          className="mt-[13px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[17px] pb-[17px]"
        >
          <div className="grid grid-cols-2 gap-x-[33px]">
            <div>
              <FieldLabel>Cycle Name</FieldLabel>
              <div className="mt-[10px]">
                <TextInput
                  label="Cycle name"
                  name="name"
                  placeholder="AACCUP Survey Visit 2026"
                  required
                />
              </div>
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <div className="mt-[10px]">
                <TextInput
                  label="Description"
                  name="description"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="mt-[16px] grid grid-cols-2 gap-x-[33px]">
            <div>
              <FieldLabel>Start Date</FieldLabel>
              <div className="mt-[10px]">
                <TextInput label="Start date" name="start_date" type="date" required />
              </div>
            </div>
            <div>
              <FieldLabel>End Date</FieldLabel>
              <div className="mt-[10px]">
                <TextInput label="End date" name="end_date" type="date" required />
              </div>
            </div>
          </div>

          <div className="mt-[20px] flex justify-end">
            <Button variant="solid" size="lg" type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Cycle"}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-[13px] text-regular leading-tight text-maroon">{error}</p>
      )}

      {cycles.length > 0 && (
        <div className="mt-[18px]">
          <DataTable columns={COLUMNS} rows={rows} />
        </div>
      )}
    </>
  );
}
