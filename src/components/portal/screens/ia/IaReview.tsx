"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Btn from "../../kit/Btn";
import FullScreenViewer from "../../kit/FullScreenViewer";
import Modal from "../../kit/Modal";
import { ReviewChip } from "../../kit/Pill";
import { useToast } from "../../kit/ToastProvider";
import { ReviewDecision } from "../../kit/ReviewDoc";
import { INDICATORS, areaComplete, ratedCount, type AreaComments, type AreaRatings, type Slot } from "@/lib/review-model";
import type { IaAssignment } from "@/lib/ia-model";
import { saveAreaComment, saveAreaRating } from "@/lib/review-actions";

/** Local, optimistic copy of this accreditor's ratings and area comments; each change is saved as it happens. */
export function useRatings(a: IaAssignment) {
  const [ratings, setRatings] = useState<AreaRatings>(a.ratings);
  const [comments, setComments] = useState<AreaComments>(a.comments);
  const [seen, setSeen] = useState({ r: a.ratings, c: a.comments });
  if (seen.r !== a.ratings || seen.c !== a.comments) {
    setSeen({ r: a.ratings, c: a.comments });
    setRatings(a.ratings);
    setComments(a.comments);
  }
  const toast = useToast();
  const router = useRouter();
  const done = (res: { ok: boolean; error?: string }) => {
    if (!res.ok) toast.say(res.error ?? "Could not save.", true);
    else router.refresh();
  };
  function set(areaId: string, indicator: number, rating: number | null) {
    setRatings((r) => ({ ...r, [areaId]: { ...(r[areaId] ?? {}), [indicator]: { rating } } }));
    saveAreaRating({ assignmentId: a.id, areaId, indicator, rating }).then(done);
  }
  /** `persist` is false while typing; the text is saved when the box loses focus. */
  function setComment(areaId: string, remark: string, persist = true) {
    setComments((c) => ({ ...c, [areaId]: remark }));
    if (persist) saveAreaComment({ assignmentId: a.id, areaId, remark }).then(done);
  }
  return { ratings, comments, set, setComment };
}

export function Indicators({
  areaNo,
  areaId,
  ratings,
  comment,
  set,
  setComment,
  disabled,
  readOnly,
  placeholder = "Overall comment for this area (required)",
}: {
  areaNo: number;
  areaId: string;
  ratings: AreaRatings;
  comment: string;
  set: ReturnType<typeof useRatings>["set"];
  setComment: ReturnType<typeof useRatings>["setComment"];
  disabled: boolean;
  readOnly: boolean;
  placeholder?: string;
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
                  <button key={n} type="button" disabled={disabled} className={cur?.rating === n ? "on" : ""} onClick={() => set(areaId, j + 1, n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div className="ind">
        <div className="top">
          <span>
            <b>Area {areaNo}</b> overall comment
          </span>
        </div>
        <textarea
          readOnly={readOnly}
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(areaId, e.target.value, false)}
          onBlur={(e) => !readOnly && setComment(areaId, e.target.value)}
        />
      </div>
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
  comments,
  set,
  setComment,
  onClose,
}: {
  a: IaAssignment;
  slot: Slot;
  kind: "phase" | "area";
  groupLabel: string;
  areaNo?: number;
  locked: boolean;
  ratings: AreaRatings;
  comments: AreaComments;
  set: ReturnType<typeof useRatings>["set"];
  setComment: ReturnType<typeof useRatings>["setComment"];
  onClose: () => void;
}) {
  const panel = (
    <>
      <h4>{kind === "phase" ? "REVIEW DOCUMENT" : "EVALUATE AREA"}</h4>
      <div className="sub">{kind === "phase" ? groupLabel : slot.name}</div>
      <ReviewDecision slot={slot} locked={locked} />
      {kind === "area" && (
        <>
          <Indicators areaNo={areaNo ?? 1} areaId={slot.refId} ratings={ratings} comment={comments[slot.refId] ?? ""} set={set} setComment={setComment} disabled={locked} readOnly={locked} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Rated {ratedCount(ratings[slot.refId])}/3 · {areaComplete(ratings[slot.refId], comments[slot.refId]) ? "overall comment added" : "overall comment needed"} · saved automatically</div>
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
