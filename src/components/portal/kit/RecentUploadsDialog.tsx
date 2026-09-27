import Link from "next/link";
import Modal from "./Modal";
import StatusPill, { type DocStatus } from "./StatusPill";

export type UploadLogEntry = {
  id: string;
  program: string;
  level: string;
  modifiedBy: string;
  timestamp: string;
  status: DocStatus;
  href?: string;
};

const HEAD = "px-[12px] py-[12px] text-regular font-normal leading-none text-gray";
const CELL = "px-[12px] py-[12px] text-regular leading-[16px] text-black";

export default function RecentUploadsDialog({
  entries,
  closeHref,
}: {
  entries: UploadLogEntry[];
  closeHref: string;
}) {
  return (
    <Modal title="Recent Uploads" closeHref={closeHref} className="w-full max-w-[900px]">
      <div className="h-[60vh] overflow-auto rounded-md border border-[color:var(--color-gray)]/25">
        <table className="w-full min-w-[640px] border-collapse">
          <caption className="sr-only">Recent uploads</caption>
          <thead className="sticky top-0 bg-surface">
            <tr>
              <th scope="col" className={`${HEAD} text-left`}>Program</th>
              <th scope="col" className={`${HEAD} text-center`}>Level</th>
              <th scope="col" className={`${HEAD} text-center`}>Modified By</th>
              <th scope="col" className={`${HEAD} text-center`}>Timestamp</th>
              <th scope="col" className={`${HEAD} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className={`${CELL} text-center text-gray`}>
                  No uploads yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-[color:var(--color-gray)]/20">
                <td className={CELL}>
                  {e.href ? (
                    <Link href={e.href} className="hover:text-maroon">
                      {e.program}
                    </Link>
                  ) : (
                    e.program
                  )}
                </td>
                <td className={`${CELL} text-center`}>{e.level}</td>
                <td className={`${CELL} text-center`}>{e.modifiedBy}</td>
                <td className={`${CELL} whitespace-nowrap text-center`}>{e.timestamp}</td>
                <td className={`${CELL} text-center`}>
                  <StatusPill status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
