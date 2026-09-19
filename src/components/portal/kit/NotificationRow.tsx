import Image from "next/image";
import type { PortalNotification } from "../data";

/**
 * One notification row — shared by the bell popover and `/portal/notifications`
 * (previously duplicated in both, in violation of the kit rule). `gap-[8px]`
 * between rows in the caller's list is what keeps unread (grey) rows from
 * touching and merging into one blob, since the row's own rounded corners
 * cancel out against an identically-toned neighbour with no space between.
 */
export default function NotificationRow({
  notification: n,
  onOpen,
}: {
  notification: PortalNotification;
  onOpen: (n: PortalNotification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex items-start gap-[16px] rounded-[16px] px-[20px] py-[16px] text-left transition-opacity hover:opacity-85 ${
        n.unread ? "bg-highlight" : ""
      }`}
    >
      <Image
        src={n.avatar}
        alt=""
        width={94}
        height={94}
        className="h-[47px] w-[47px] shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="break-words text-subheading leading-[22px] text-black">
          {n.name && <span className="font-bold">{n.name} </span>}
          {n.body}
        </p>
        <p className="mt-[8px] text-regular leading-none text-link">{n.time}</p>
      </div>
      {n.unread && (
        <span className="mt-[6px] h-[10px] w-[10px] shrink-0 rounded-full bg-link" />
      )}
    </button>
  );
}
