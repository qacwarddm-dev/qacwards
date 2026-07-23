import Image from "next/image";

/** Centred illustration + message, shown when a folder has no contents. */
export default function EmptyState({
  message = "This folder is empty.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center pt-[133px]">
      <Image
        src="/assets/portal/empty-folder.png"
        alt=""
        width={290}
        height={250}
        className="h-[125px] w-[145px] object-contain"
      />
      <p className="mt-[10px] text-subheading leading-none text-maroon">{message}</p>
    </div>
  );
}
