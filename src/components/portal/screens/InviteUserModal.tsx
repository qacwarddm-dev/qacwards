"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Modal, SelectField, TextField, useToast } from "@/components/portal/kit";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { UserRole } from "@/lib/database.types";

const ROLES: UserRole[] = [
  "program_representative",
  "internal_accreditor",
  "qac_personnel",
  "qac_admin",
];

/**
 * "Invite user" — 2026-09-19 client meeting, stub pass only: email + role,
 * no real invite. There is no `invites` table and no mailer wired to this yet
 * (unlike `email_outbox`, which is real), so submitting only confirms the
 * intent with a toast and closes — the same fixture-backed-submit call the
 * Extension Monitoring and Feedback screens already made for a table that
 * does not exist yet, flagged here rather than faked as a real send.
 */
export default function InviteUserModal({ closeHref }: { closeHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("program_representative");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter the webmail to invite.");
      return;
    }
    toast.push({
      tone: "success",
      title: "Invite ready",
      description: `${email.trim()} would be invited as ${ROLE_LABELS[role]}. Sending isn't wired up yet.`,
    });
    router.push(closeHref);
  }

  return (
    <Modal title="Invite User" closeHref={closeHref} className="w-[420px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
        <TextField
          label="Webmail"
          type="email"
          required
          placeholder="example@pup.edu.ph"
          value={email}
          error={error ?? undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />

        <SelectField
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />

        <div className="mt-[4px] flex justify-end gap-[12px]">
          <Button variant="ghost" href={closeHref}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
