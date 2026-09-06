"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  fetchExpertiseFor,
  setAccreditorExpertise,
  setInternalAccreditorFlag,
} from "@/lib/accreditor-actions";
import { Button, Dialog, ExpertisePicker, Spinner } from "../kit";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { UserRole } from "@/lib/database.types";

/**
 * QAC Admin → User Management → edit a user's accreditor details — round 2 §2
 * and §3, which the client's notes put on the same screen.
 *
 * Two writes, one dialog, because they are one decision: an admin adding the
 * Internal Accreditor role to a QAC Personnel account is doing it *for a
 * specialty*, so asking them to save the role here and the specialty somewhere
 * else would split the task the note describes.
 *
 * They are still two server actions rather than one combined write. The role and
 * the specialty live in different tables under different policies, and pairing
 * them into a single action would only hide which half failed.
 */
export default function UserAccreditorEditor({
  user,
}: {
  user: { id: string; name: string; role: UserRole; isInternalAccreditor: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [areas, setAreas] = useState<{ id: string; name: string }[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [alsoAccreditor, setAlsoAccreditor] = useState(user.isInternalAccreditor);

  // The role IS accreditor, so the flag is not a question that applies — see
  // the column comment in 20260906000200_accreditor_round2.sql.
  const roleIsAccreditor = user.role === "internal_accreditor";
  const actsAsAccreditor = roleIsAccreditor || alsoAccreditor;

  // Reset to what is on file each time the dialog opens, adjusted during render
  // rather than in an effect — the same pattern the create-assignment screen
  // uses for its cascading picker, so a stale tick is never committed and
  // corrected a frame later.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setAlsoAccreditor(user.isInternalAccreditor);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchExpertiseFor(user.id).then((data) => {
      if (cancelled) return;
      setAreas(data.areas);
      setSelected(data.selected);
    });
    return () => {
      cancelled = true;
    };
  }, [open, user.id]);

  function save() {
    setError(null);
    startTransition(async () => {
      if (!roleIsAccreditor && alsoAccreditor !== user.isInternalAccreditor) {
        const result = await setInternalAccreditorFlag(user.id, alsoAccreditor);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }

      // Only when they actually are one. Removing the second role leaves the
      // specialty rows in place rather than deleting them: nothing reads an
      // expertise row for a non-accreditor, and clearing it would silently
      // destroy work if the admin unticks the box by mistake.
      if (actsAsAccreditor) {
        const expertise = await setAccreditorExpertise(user.id, selected);
        if (!expertise.ok) {
          setError(expertise.error);
          return;
        }
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="md" onClick={() => setOpen(true)}>
        Edit
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        title="Edit user details"
        description={user.name}
        size="lg"
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" disabled={pending || areas === null} onClick={save}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-gray)]/5 px-[16px] py-[14px]">
          <span className="t-sm font-semibold text-black">System Role</span>
          <p className="t-sm mt-[4px] text-gray">{ROLE_LABELS[user.role]}</p>

          {roleIsAccreditor ? (
            <p className="t-sm mt-[12px] text-gray">
              This account is an Internal Accreditor by role, so there is no second
              role to add.
            </p>
          ) : (
            <label className="mt-[12px] flex items-start gap-[10px]">
              <input
                type="checkbox"
                checked={alsoAccreditor}
                disabled={pending}
                onChange={(e) => setAlsoAccreditor(e.target.checked)}
                className="mt-[2px] h-[16px] w-[16px] accent-[color:var(--color-maroon)]"
              />
              <span>
                <span className="t-sm block font-semibold text-black">
                  Also acts as an Internal Accreditor
                </span>
                <span className="t-sm block text-gray">
                  Keeps every {ROLE_LABELS[user.role]} screen and adds the accreditor
                  ones. Use this when no Internal Accreditor is available for a
                  specialty.
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="mt-[20px]">
          {areas === null ? (
            <div className="flex justify-center py-[24px]">
              <Spinner />
            </div>
          ) : actsAsAccreditor ? (
            <ExpertisePicker
              areas={areas}
              selected={selected}
              onChange={setSelected}
              disabled={pending}
            />
          ) : (
            <p className="t-sm text-gray">
              Specialty applies to accreditors. Tick the box above to set one.
            </p>
          )}
        </div>

        {error && <p className="mt-[16px] t-sm leading-tight text-maroon">{error}</p>}
      </Dialog>
    </>
  );
}
