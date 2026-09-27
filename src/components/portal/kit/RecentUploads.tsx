import Card from "./Card";
import CardTitleBar from "./CardTitleBar";
import UploadList, { type Upload } from "./UploadList";
import ViewAllLink from "./ViewAllLink";

const LAYOUT = {
  side: "h-[294px] w-full lg:w-[450px]",
  full: "mt-[20px] h-[294px] w-full",
} as const;

export default function RecentUploads({
  uploads,
  viewAllHref,
  layout = "side",
  radius = 20,
}: {
  uploads: Upload[];
  viewAllHref: string;
  layout?: keyof typeof LAYOUT;
  radius?: 10 | 20;
}) {
  return (
    <Card radius={radius} className={`flex flex-col overflow-hidden ${LAYOUT[layout]}`}>
      <CardTitleBar
        title="Recent Uploads"
        divider
        action={<ViewAllLink href={viewAllHref} scroll={false} />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {uploads.length === 0 ? (
          <p className="px-[24px] py-[20px] text-regular text-gray">No uploads yet.</p>
        ) : (
          <UploadList uploads={uploads} />
        )}
      </div>
    </Card>
  );
}
