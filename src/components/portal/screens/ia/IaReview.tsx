"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Btn from "../../kit/Btn";
import FullScreenViewer from "../../kit/FullScreenViewer";
import Modal from "../../kit/Modal";
import { ReviewChip } from "../../kit/Pill";
import { useToast } from "../../kit/ToastProvider";
import { ReviewDecision } from "../../kit/ReviewDoc";
import { INDICATORS, ratedCount, type AreaRatings, type IndicatorRating, type Slot } from "@/lib/review-model";
import type { IaAssignment } from "@/lib/ia-model";
import { saveAreaRating } from "@/lib/review-actions";

/** Local, optimistic copy of this accreditor's ratings; each change is saved as it happens. */
export function useRatings(a: IaAssignment) {
  const [ratings, setRatings] = useState<AreaRatings>(a.ratings);
  const [seen, setSeen] = useState(a.ratings);
  if (seen !== a.ratings) {
    setSeen(a.ratings);
    setRatings(a.ratings);
  }
  const toast = useToast();
  const router = useRouter();
  function set(areaId: string, indicator: number, patch: Partial<IndicatorRating>, persist = true) {
    const cur = ratings[areaId]?.[indicator] ?? { rating: null, remark: "" };
    const next = { ...cur, ...patch };
    setRatings((r) => ({ ...r, [areaId]: { ...(r[areaId] ?? {}), [indicator]: next } }));
    if (!persist) return;
    saveAreaRating({ assignmentId: a.id, areaId, indicator, rating: next.rating, remark: next.remark }).then((res) => {
      if (!res.ok) toast.say(res.error, true);
      else router.refresh();
    });
  }
  return { ratings, set };
}

export function Indicators({
  areaNo,
  areaId,
  ratings,
  set,
  disabled,
  readOnly,
}: {
  areaNo: number;
  areaId: string;
  ratings: AreaRatings;
  set: ReturnType<typeof useRatings>["set"];
  disabled: boolean;
  readOnly: boolean;
}) {
  return (
    <>
      {INDICATORS.map((t, j) => {
        const cur = ratings[areaId]?.[j + 1];
        return (
          <div key={t} className="ind">
            <div className="top">
              <span>
                <b>
                  {areaNo}.{j + 1}
                </b>{" "}
                {t}
              </span>
              <div className="rate">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" disabled={disabled} className={cur?.rating === n ? "on" : ""} onClick={() => set(areaId, j + 1, { rating: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              readOnly={readOnly}
              placeholder="Remarks for the report (optional)"
              value={cur?.remark ?? ""}
              onChange={(e) => set(areaId, j + 1, { remark: e.target.value }, false)}
              onBlur={(e) => !readOnly && set(areaId, j + 1, { remark: e.target.value })}
            />
          </div>
        );
      })}
    </>
  );
}

export function ReviewFullScreen({
  a,
  slot,
  kind,
  groupLabel,
  areaNo,
  locked,
  ratings,
  set,
  onClose,
}: {
  a: IaAssignment;
  slot: Slot;
  kind: "phase" | "area";
  groupLabel: string;
  areaNo?: number;
  locked: boolean;
  ratings: AreaRatings;
  set: ReturnType<typeof useRatings>["set"];
  onClose: () => void;
}) {
  const panel = (
    <>
      <h4>{kind === "phase" ? "REVIEW DOCUMENT" : "EVALUATE AREA"}</h4>
      <div className="sub">{kind === "phase" ? groupLabel : slot.name}</div>
      <ReviewDecision slot={slot} locked={locked} />
      {kind === "area" && (
        <>
          <Indicators areaNo={areaNo ?? 1} areaId={slot.refId} ratings={ratings} set={set} disabled={locked} readOnly={locked} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Rated {ratedCount(ratings[slot.refId])}/3 · saved automatically</div>
        </>
      )}
    </>
  );
  return (
    <FullScreenViewer
      docId={slot.docId}
      file={slot.file ?? slot.name}
      meta={`${a.mid} · ${kind === "phase" ? `${groupLabel} · ${slot.name}` : slot.name} · ${slot.size} · ${slot.date}${slot.version > 1 ? ` · v${slot.version}` : ""}`}
      status={<ReviewChip state={slot.state} />}
      panelLabel={kind === "area" ? "Evaluate" : "Review"}
      panel={panel}
      onClose={onClose}
    />
  );
}

export function RatingGuide({ levelName, onClose }: { levelName: string; onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title={`Rating guide · ${levelName}`}
      sub="Scale used for every indicator on this level."
      footer={
        <Btn variant="o" onClick={onClose}>
          Close
        </Btn>
      }
      bodyStyle={{ fontSize: 13, lineHeight: 1.8 }}
    >
      <b>5 · Excellent</b> — complete, updated, and fully implemented
      <br />
      <b>4 · Very Satisfactory</b> — complete with minor gaps
      <br />
      <b>3 · Satisfactory</b> — mostly complete
      <br />
      <b>2 · Fair</b> — major documents missing
      <br />
      <b>1 · Poor</b> — not met
      <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
        Approve or return each document first. Rate an area only after its document is approved.
      </div>
    </Modal>
  );
}
