import Image from "next/image";

export type AvatarPerson = {
  id: string;
  name: string;
  avatar: string;
};

/**
 * Overlapping circle group with a trailing "+N" bubble past `max` — the
 * Event Schedule Participants column. `avatar` is already resolved (a signed
 * URL or the shared placeholder), same as the top bar's identity photo.
 */
export default function AvatarStack({
  people,
  max = 4,
}: {
  people: AvatarPerson[];
  max?: number;
}) {
  if (people.length === 0) return <span className="text-subheading text-gray">—</span>;

  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <span className="flex items-center -space-x-[10px]">
      {shown.map((p) => (
        <Image
          key={p.id}
          src={p.avatar}
          alt={p.name}
          title={p.name}
          width={28}
          height={28}
          unoptimized={p.avatar.includes("/storage/v1/")}
          className="h-[28px] w-[28px] rounded-full border-2 border-white object-cover"
        />
      ))}
      {overflow > 0 && (
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-white bg-maroon text-small font-semibold leading-none text-white">
          +{overflow}
        </span>
      )}
    </span>
  );
}
