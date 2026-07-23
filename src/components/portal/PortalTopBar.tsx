import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CURRENT_USER } from "./portal-nav";

/**
 * Portal top bar. Measured off assets/FIGMA/qac_personnel/01-Dashboard.png —
 * pixel-identical across all twelve exported frames, so it lives in the shell.
 * Frame is a 2x export of a 1440 design, so every export measurement is halved.
 */
export default function PortalTopBar() {
  return (
    <header className="flex h-[59px] shrink-0 items-center bg-maroon pl-[25px] pr-[25px] text-white">
      <Image
        src="/assets/logos/qac.png"
        alt="Quality Assurance Center seal"
        width={3568}
        height={2880}
        className="h-[45px] w-auto object-contain"
        priority
      />

      <span className="ml-[15px] mt-[15px] flex flex-col self-start">
        <span className="font-pup text-small leading-[12.5px]">
          Polytechnic University of the Philippines
        </span>
        <span className="font-qac text-heading font-bold uppercase leading-[20px]">
          Quality Assurance Center
        </span>
      </span>

      <div className="ml-auto flex items-center">
        <button
          type="button"
          aria-label={`Notifications (${CURRENT_USER.notifications})`}
          className="relative flex h-[29px] w-[29px] items-center justify-center rounded-full bg-white"
        >
          <Bell
            className="h-[17px] w-[17px] text-maroon"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <span className="absolute right-[-0.5px] top-[0.5px] flex h-[10px] w-[10px] items-center justify-center rounded-full bg-alert text-[7px] font-bold leading-none text-white">
            {CURRENT_USER.notifications}
          </span>
        </button>

        <Link
          href="/portal/profile"
          className="ml-[14px] flex items-center transition-opacity hover:opacity-85"
        >
          <span className="flex flex-col text-right">
            <span className="text-subheading font-semibold leading-[17px]">
              {CURRENT_USER.name}
            </span>
            <span className="text-subheading leading-[17px]">
              {CURRENT_USER.position}
            </span>
          </span>

          <Image
            src={CURRENT_USER.avatar}
            alt=""
            width={80}
            height={80}
            className="ml-[14px] h-[40px] w-[40px] rounded-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
