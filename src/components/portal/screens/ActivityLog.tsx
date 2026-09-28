"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FilePlus2,
  FileText,
  History,
  PenLine,
  Send,
  Signature,
  Star,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button, Card, EmptyState, SectionHeading } from "../kit";
import { loadOlderActivity } from "@/lib/activity-actions";
import type { ActivityEntry, ActivityFeed, ActivityFilter, ActivityIcon } from "@/lib/activity";

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submissions", label: "Submissions" },
  { key: "agreements", label: "Agreements" },
  { key: "evaluations", label: "Evaluations" },
  { key: "account", label: "Account" },
];

const MAROON_TILE = "bg-[color:var(--tint-maroon)] text-maroon";
const YELLOW_TILE =
  "bg-[color:var(--tint-yellow)] text-[color:color-mix(in_srgb,var(--color-yellow)_55%,black)]";
const BLUE_TILE =
  "bg-[color:color-mix(in_srgb,var(--color-holiday)_10%,white)] text-[color:var(--color-holiday)]";
const GREEN_TILE = "bg-[color:var(--tint-approved)] text-[color:var(--color-approved)]";
const GRAY_TILE = "bg-[color:var(--color-gray)]/10 text-black/70";

const TILES: Record<ActivityIcon, { icon: LucideIcon; skin: string }> = {
  upload: { icon: Upload, skin: MAROON_TILE },
  submit: { icon: Send, skin: MAROON_TILE },
  remove: { icon: Trash2, skin: MAROON_TILE },
  document: { icon: FileText, skin: MAROON_TILE },
  start: { icon: FilePlus2, skin: YELLOW_TILE },
  evaluation: { icon: Star, skin: YELLOW_TILE },
  agreement: { icon: PenLine, skin: BLUE_TILE },
  signature: { icon: Signature, skin: BLUE_TILE },
  event: { icon: CalendarDays, skin: BLUE_TILE },
  photo: { icon: Camera, skin: GREEN_TILE },
  decision: { icon: CircleCheck, skin: GREEN_TILE },
  assignment: { icon: ClipboardList, skin: GRAY_TILE },
  account: { icon: UserRound, skin: GRAY_TILE },
};

const dayOf = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "Asia/Manila" })
    .toUpperCase();

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

function groupByDay(entries: ActivityEntry[]) {
  const days: { day: string; entries: ActivityEntry[] }[] = [];
  for (const e of entries) {
    const day = dayOf(e.at);
    const last = days[days.length - 1];
    if (last?.day === day) last.entries.push(e);
    else days.push({ day, entries: [e] });
  }
  return days;
}

export default function ActivityLog({
  heading,
  filter,
  initial,
}: {
  heading: string;
  filter: ActivityFilter;
  initial: ActivityFeed;
}) {
  const [entries, setEntries] = useState(initial.entries);
  const [next, setNext] = useState(initial.next);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function loadOlder() {
    if (!next) return;
    startTransition(async () => {
      const page = await loadOlderActivity(filter, next);
      setFresh(new Set(page.entries.map((e) => e.id)));
      setEntries((prev) => [...prev, ...page.entries.filter((e) => !prev.some((p) => p.id === e.id))]);
      setNext(page.next);
    });
  }

  const label = FILTERS.find((f) => f.key === filter)?.label ?? "All";

  return (
    <Card className="px-[20px] pb-[26px] pt-[22px] sm:px-[28px]">
      <div className="flex flex-wrap items-start justify-between gap-x-[24px] gap-y-[16px]">
        <div>
          <Link
            href="/portal/profile"
            className="inline-flex items-center gap-[2px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
          >
            <ChevronLeft className="h-[14px] w-[14px]" strokeWidth={2.25} aria-hidden />
            Back to Profile
          </Link>
          <div className="mt-[14px]">
            <SectionHeading icon={History}>{heading}</SectionHeading>
          </div>
        </div>
        <nav aria-label="Filter activity" className="flex flex-wrap gap-[6px]">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/portal/activity" : `/portal/activity?filter=${f.key}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`inline-flex h-[30px] items-center rounded-full border px-[14px] text-regular leading-none transition-colors duration-[var(--motion-fast)] ${
                  active
                    ? "border-maroon bg-maroon font-semibold text-white"
                    : "border-[color:var(--hairline-strong)] bg-white text-black hover:border-maroon hover:text-maroon"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {entries.length === 0 ? (
        <div className="mt-[24px]">
          <EmptyState
            title={filter === "all" ? "No activity here yet." : `Nothing under ${label} yet.`}
            description="Things you do in QAC-WARDS, like uploads and signed agreements, show up here."
          />
        </div>
      ) : (
        <div className="mt-[10px]">
          {groupByDay(entries).map((group) => (
            <section key={group.day} aria-label={group.day}>
              <h3 className="mb-[2px] mt-[18px] text-regular font-bold tracking-[0.04em] text-black/60">
                {group.day}
              </h3>
              <ul>
                {group.entries.map((e) => (
                  <ActivityItem key={e.id} entry={e} fresh={fresh.has(e.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {next && (
        <div className="mt-[20px] flex justify-center">
          <Button variant="secondary" size="lg" loading={pending} onClick={loadOlder}>
            Show older activity
          </Button>
        </div>
      )}
    </Card>
  );
}

function ActivityItem({ entry, fresh }: { entry: ActivityEntry; fresh: boolean }) {
  const { icon: Icon, skin } = TILES[entry.icon];
  return (
    <li
      className={`flex flex-wrap items-center gap-x-[14px] gap-y-[4px] border-b border-[color:var(--hairline)] px-[6px] py-[12px] last:border-b-0 ${
        fresh ? "animate-[rise-in_var(--motion-slow)_var(--ease-out)_both]" : ""
      }`}
    >
      <span aria-hidden className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] ${skin}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 basis-[calc(100%-52px)] sm:flex-1 sm:basis-0">
        <p className="text-subheading leading-snug text-black">{entry.title}</p>
        {entry.context && <p className="mt-[2px] text-regular text-black/70">{entry.context}</p>}
        {entry.actor && <p className="mt-[2px] text-regular text-black/70">By {entry.actor}</p>}
      </div>
      <div className="ml-[52px] flex items-center gap-[20px] sm:ml-0">
        <time dateTime={entry.at} className="whitespace-nowrap text-regular text-black/70">
          {timeOf(entry.at)}
        </time>
        <span className="flex w-[52px] justify-end">
          {entry.href && (
            <Link
              href={entry.href}
              className="inline-flex items-center gap-[2px] whitespace-nowrap text-regular font-semibold text-maroon transition-opacity hover:opacity-70"
            >
              View
              <ChevronRight className="h-[13px] w-[13px]" strokeWidth={2.5} aria-hidden />
            </Link>
          )}
        </span>
      </div>
    </li>
  );
}
