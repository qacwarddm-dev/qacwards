import { ArrowDownUp, Plus } from "lucide-react";
import BackLink from "./BackLink";
import Breadcrumb, { type Crumb } from "./Breadcrumb";
import Button from "./Button";
import SearchField from "./SearchField";
import ViewToggle from "./ViewToggle";

/**
 * The chrome every document screen shares: back link, centred search box, then
 * a row of breadcrumb + New / view toggle / Sort. Only the grid below changes.
 *
 * Documents pages use a 74px content inset, wider than the dashboard's 57px —
 * measured, not assumed.
 */
export default function DocumentBrowser({
  backHref,
  crumbs,
  children,
}: {
  backHref: string;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="px-[74px] pt-[31px] pb-[45px]">
      <div className="relative flex h-[42.5px] items-center">
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <BackLink href={backHref} />
        </div>
        <div className="mx-auto">
          <SearchField />
        </div>
      </div>

      <div className="mt-[43.5px] flex h-[32px] items-center gap-[20px]">
        <div className="min-w-0 flex-1">
          <Breadcrumb items={crumbs} />
        </div>
        <Button variant="outline" icon={Plus}>
          New
        </Button>
        <ViewToggle />
        <Button variant="solid" icon={ArrowDownUp}>
          Sort
        </Button>
      </div>

      <div className="mt-[46px]">{children}</div>
    </div>
  );
}
