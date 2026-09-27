"use client";

import { CircleArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteRepositoryFolder,
  renameRepositoryFile,
  renameRepositoryFolder,
  archiveRepositoryFile,
} from "@/lib/document-actions";
import {
  Breadcrumb,
  Button,
  ConfirmDialog,
  Dialog,
  DocCard,
  EmptyState,
  FileList,
  type FileListEntry,
  FolderCard,
  type MenuItem,
  SearchField,
  SortMenu,
  type SortState,
  TextField,
  ViewToggle,
  type BrowserView,
  useToast,
} from "../kit";
import { PR_ACCREDITATION_FOLDER_ART } from "../data";

export type ReportsFolder = {
  id: string;
  slug: string;
  name: string;
  fileCount: number;
  lastModified: string | null;
};

export type ReportsFile = {
  id: string;
  title: string;
  owner: string | null;
  createdAt: string;
  size: number | null;
};

type Target = { kind: "folder" | "file"; id: string; name: string };

const REPORTS_HREF = "/portal/documents?tab=reports";

function formatDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes: number | null): string | undefined {
  if (bytes === null) return undefined;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sortBy<T>(items: T[], sort: SortState, name: (t: T) => string, date: (t: T) => string | null) {
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sort.key === "modified") {
      return dir * (date(a) ?? "").localeCompare(date(b) ?? "");
    }
    return dir * name(a).localeCompare(name(b), undefined, { sensitivity: "base", numeric: true });
  });
}

export default function RepReportsBrowser({
  programId,
  folders,
  folder,
  files,
}: {
  programId: string | null;
  folders: ReportsFolder[];
  folder: ReportsFolder | null;
  files: ReportsFile[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<BrowserView>("grid");
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });
  const [renaming, setRenaming] = useState<Target | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Target | null>(null);

  const needle = query.trim().toLowerCase();

  const shownFolders = useMemo(
    () =>
      sortBy(
        folders.filter((f) => f.name.toLowerCase().includes(needle)),
        sort,
        (f) => f.name,
        (f) => f.lastModified,
      ),
    [folders, needle, sort],
  );

  const shownFiles = useMemo(
    () =>
      sortBy(
        files.filter((f) => f.title.toLowerCase().includes(needle)),
        sort,
        (f) => f.title,
        (f) => f.createdAt,
      ),
    [files, needle, sort],
  );

  function openRename(target: Target) {
    setRenaming(target);
    setRenameValue(target.name);
    setRenameError(null);
  }

  function submitRename() {
    if (!renaming || !programId) return;
    const target = renaming;
    startTransition(async () => {
      const result =
        target.kind === "folder"
          ? await renameRepositoryFolder(programId, target.id, renameValue)
          : await renameRepositoryFile(target.id, renameValue);
      if (!result.ok) {
        setRenameError(result.error);
        return;
      }
      setRenaming(null);
      toast.push({ tone: "success", title: "Renamed." });
      router.refresh();
    });
  }

  async function confirmDelete() {
    if (!deleting || !programId) return;
    const result =
      deleting.kind === "folder"
        ? await deleteRepositoryFolder(programId, deleting.id)
        : await archiveRepositoryFile(deleting.id);
    if (!result.ok) {
      toast.push({ tone: "error", title: result.error });
      return;
    }
    toast.push({ tone: "success", title: `${deleting.name} deleted.` });
    setDeleting(null);
    if (deleting.kind === "folder" && folder?.id === deleting.id) router.push(REPORTS_HREF);
    router.refresh();
  }

  const folderMenu = (f: ReportsFolder): MenuItem[] => [
    { label: "Rename", onSelect: () => openRename({ kind: "folder", id: f.id, name: f.name }) },
    {
      label: "Download",
      href: `/api/documents/repository-zip?program=${programId}&folder=${f.id}&name=${encodeURIComponent(f.name)}`,
    },
    { label: "Delete", onSelect: () => setDeleting({ kind: "folder", id: f.id, name: f.name }) },
  ];

  const fileMenu = (f: ReportsFile): MenuItem[] => [
    { label: "Rename", onSelect: () => openRename({ kind: "file", id: f.id, name: f.title }) },
    { label: "Download", href: `/api/documents/download?source=repository&id=${f.id}&download=1` },
    { label: "Delete", onSelect: () => setDeleting({ kind: "file", id: f.id, name: f.title }) },
  ];

  const folderHref = (f: ReportsFolder) =>
    `${REPORTS_HREF}&folder=${encodeURIComponent(f.slug)}`;

  let body: React.ReactNode;
  if (folder) {
    if (files.length === 0) {
      body = <EmptyState variant="empty" title="This folder is empty." />;
    } else if (shownFiles.length === 0) {
      body = <EmptyState variant="no-results" title={`No files match "${query.trim()}".`} />;
    } else if (view === "list") {
      body = (
        <FileList
          entries={shownFiles.map(
            (f): FileListEntry => ({
              id: f.id,
              kind: "file",
              name: f.title,
              owner: f.owner ?? undefined,
              modified: formatDate(f.createdAt),
              size: formatSize(f.size),
              href: `/api/documents/download?source=repository&id=${f.id}`,
              menu: fileMenu(f),
            }),
          )}
        />
      );
    } else {
      body = (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(194px,1fr))] gap-[27px]">
          {shownFiles.map((f) => (
            <DocCard
              key={f.id}
              title={f.title}
              href={`/api/documents/download?source=repository&id=${f.id}`}
              menu={fileMenu(f)}
            />
          ))}
        </div>
      );
    }
  } else if (shownFolders.length === 0) {
    body = <EmptyState variant="no-results" title={`No folders match "${query.trim()}".`} />;
  } else if (view === "list") {
    body = (
      <FileList
        entries={shownFolders.map(
          (f): FileListEntry => ({
            id: f.id,
            kind: "folder",
            name: f.name,
            owner: "Quality Assurance Center",
            modified: formatDate(f.lastModified),
            size: `${f.fileCount} file${f.fileCount === 1 ? "" : "s"}`,
            href: folderHref(f),
            menu: folderMenu(f),
          }),
        )}
      />
    );
  } else {
    body = (
      <div className="flex flex-wrap justify-center gap-[36px]">
        {shownFolders.map((f) => (
          <FolderCard
            key={f.id}
            label={f.name}
            href={folderHref(f)}
            art={PR_ACCREDITATION_FOLDER_ART[f.slug]}
            menu={folderMenu(f)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-[54px] pb-[42px] pt-[42px]">
      <div className="flex h-[43px] items-center gap-[12px]">
        <div className="w-[494px] min-w-0">
          <SearchField
            className="w-full"
            label={folder ? "Search files" : "Search folders"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-[7px]">
          <ViewToggle value={view} onChange={setView} />
          <SortMenu value={sort} onChange={setSort} />
        </div>
      </div>

      {folder ? (
        <div className="mt-[18px] flex items-center gap-[16px]">
          <div className="min-w-0 flex-1">
            <Breadcrumb
              items={[
                { label: "AACCUP & COPC Reports", href: REPORTS_HREF },
                { label: folder.name },
              ]}
            />
          </div>
          <Link
            href={REPORTS_HREF}
            className="flex shrink-0 items-center gap-[7px] text-regular leading-none text-gray transition-opacity hover:opacity-70"
          >
            <CircleArrowLeft className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
            Back
          </Link>
        </div>
      ) : null}

      <div className={folder ? "mt-[24px]" : "mt-[60px]"}>{body}</div>

      <Dialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title={renaming?.kind === "folder" ? "Rename folder" : "Rename file"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={pending} onClick={submitRename}>
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitRename();
          }}
        >
          <TextField
            label="Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={renameError ?? undefined}
            maxLength={150}
            required
          />
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.kind === "folder" ? "Delete folder" : "Delete file"}
        tone="danger"
        confirmLabel="Delete"
        description={
          deleting?.kind === "folder"
            ? `"${deleting.name}" and every file in it will be removed from your programme's reports.`
            : `"${deleting?.name}" will be removed from this folder.`
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
