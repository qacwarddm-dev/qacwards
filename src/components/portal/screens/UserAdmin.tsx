"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, DataTable } from "@/components/portal/kit";
import { searchUsers, setUserActive, setUserRole } from "@/lib/admin";
import { ROLE_LABELS } from "@/lib/current-user";
import type { UserRole } from "@/lib/database.types";

/**
 * UC-019 — activate, deactivate, and change a role.
 *
 * Roles are shown by their UI label, so `program_representative` reads "Academic
 * Program" (O-4). The value sent is always the enum.
 *
 * The two self-targeting guards (you cannot deactivate yourself, you cannot
 * change your own role) are enforced in the server action; they are mirrored here
 * only to grey the control out. The action is the one that decides — a disabled
 * button is a courtesy, not a control.
 */
type User = {
  id: string;
  name: string;
  webmail: string;
  role: UserRole;
  isActive: boolean;
};

const ROLES: UserRole[] = [
  "program_representative",
  "internal_accreditor",
  "qac_personnel",
  "qac_admin",
];

const COLUMNS = [
  { key: "name", header: "Name", width: "flex-1" },
  { key: "role", header: "Role", width: "w-[230px]" },
  { key: "status", header: "Status", width: "w-[100px]" },
  { key: "actions", header: "", width: "w-[150px]", align: "center" as const },
];

export default function UserAdmin({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // §8.2: search runs server-side through RLS (searchUsers, src/lib/admin.ts)
  // rather than filtering the `users` prop client-side — that prop is only
  // this page's first load, not the whole table, once the roster outgrows it.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return; // `visible` below falls back to `users` on its own
    const id = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchUsers(q));
      });
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const visible = query.trim().length >= 2 ? (results ?? users) : users;

  function toggleActive(user: User) {
    setError(null);
    startTransition(async () => {
      const result = await setUserActive(user.id, !user.isActive);
      if (!result.ok) setError(result.error);
    });
  }

  function changeRole(userId: string, role: UserRole) {
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(userId, role);
      if (!result.ok) setError(result.error);
    });
  }

  const rows = visible.map((user) => {
    const isSelf = user.id === currentUserId;
    return {
      id: user.id,
      cells: {
        name: (
          <span className="flex flex-col">
            <span className="text-subheading leading-none text-black">
              {user.name}
              {isSelf && <span className="ml-[6px] text-regular text-gray">(you)</span>}
            </span>
            <span className="mt-[4px] text-regular leading-none text-gray">
              {user.webmail}
            </span>
          </span>
        ),
        role: (
          <select
            aria-label={`Role for ${user.name}`}
            value={user.role}
            disabled={pending || isSelf}
            onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
            className="h-[32px] w-[210px] rounded-[10px] border border-[color:var(--color-gray)]/50 bg-white px-[10px] text-regular text-black disabled:opacity-50"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        ),
        status: (
          <span
            className={`text-regular font-semibold ${
              user.isActive ? "text-[color:var(--color-approved)]" : "text-maroon"
            }`}
          >
            {user.isActive ? "Active" : "Deactivated"}
          </span>
        ),
        actions: (
          <span className="flex justify-center">
            <Button
              variant={user.isActive ? "outline" : "solid"}
              size="md"
              disabled={pending || (isSelf && user.isActive)}
              onClick={() => toggleActive(user)}
            >
              {user.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </span>
        ),
      },
    };
  });

  return (
    <>
      <p className="mt-[13px] text-regular text-gray">
        Deactivating an account locks it out on its next request, not at its next
        login.
      </p>

      {error && (
        <p className="mt-[13px] text-regular leading-tight text-maroon">{error}</p>
      )}

      <div className="mt-[18px]">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          search={{
            value: query,
            onChange: setQuery,
            label: "Search users",
            placeholder: "Search by name or webmail…",
          }}
        />
      </div>
    </>
  );
}
