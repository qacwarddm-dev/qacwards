"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssignmentDetail } from "@/lib/assignments";
import { HEADER_KEYS, levelLine } from "@/lib/evaluation-sheet";
import { Button, Modal, SelectField, TextField } from "../kit";
import { useSheetAutosave } from "./useSheetAutosave";

/** "Preliminary Survey Instrument" (docs/internal_accreditor.pdf p.3). Program,
 *  campus and team come from the assignment and are locked; address and visit
 *  date are the sheet's first two answers and autosave like the rest of it. */
export default function SurveyInstrumentModal({
  assignmentId,
  detail,
  initialAddress,
  initialVisitDate,
  onCancel,
}: {
  assignmentId: string;
  detail: AssignmentDetail;
  initialAddress: string;
  initialVisitDate: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const { values, setValue, flush, error } = useSheetAutosave(
    assignmentId,
    { [HEADER_KEYS.address]: initialAddress, [HEADER_KEYS.visitDate]: initialVisitDate },
    { poll: false },
  );

  const team = detail.signatories
    .filter((s) => s.response === "accepted")
    .map((s) => s.name)
    .join("; ");
  const isPsv = detail.levelCode === "PSV";

  async function evaluate() {
    setLeaving(true);
    await flush();
    router.push(`/portal/evaluation/${assignmentId}/sheet`);
  }

  return (
    <Modal
      title={isPsv ? "Preliminary Survey Instrument" : "Accreditation Survey Instrument"}
      titleAlign="start"
      className="w-[600px]"
    >
      <p className="text-center text-subheading font-bold leading-none text-black">
        {levelLine(detail.levelCode, detail.level)}
      </p>

      <div className="mt-[20px] flex flex-col gap-[16px]">
        <SelectField
          label="Program"
          disabled
          value="program"
          options={[{ value: "program", label: detail.program }]}
          onChange={() => {}}
        />
        <SelectField
          label="SUC/Campus"
          disabled
          value="campus"
          options={[{ value: "campus", label: detail.campus }]}
          onChange={() => {}}
        />
        <TextField
          label="Address"
          placeholder="Enter Campus Address"
          value={values[HEADER_KEYS.address] ?? ""}
          onChange={(e) => setValue(HEADER_KEYS.address, e.target.value)}
        />
        <div className="flex gap-[16px]">
          <div className="flex-1">
            <TextField
              label="Date of Visit"
              type="date"
              value={values[HEADER_KEYS.visitDate] ?? ""}
              onChange={(e) => setValue(HEADER_KEYS.visitDate, e.target.value)}
            />
          </div>
          <div className="flex-1">
            <SelectField
              label="Accreditor"
              disabled
              value="team"
              options={[{ value: "team", label: team || "—" }]}
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-[12px] text-small text-maroon">{error}</p>}

      <div className="mt-[28px] flex justify-end gap-[16px]">
        <Button variant="ghost" onClick={onCancel} disabled={leaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={evaluate} loading={leaving}>
          Evaluate
        </Button>
      </div>
    </Modal>
  );
}
