import CopcChart from "@/components/portal/CopcChart";
import { StatRow, type Stat } from "@/components/portal/kit";

/**
 * QAC Personnel dashboard — assets/FIGMA/qac_personnel/01-Dashboard.png.
 * Paddings are back-solved from measured cap-top positions with the formula in
 * design/prototype-notes.md, so they will not look like round design numbers.
 *
 * B9 made this the presentational half: `data` comes from
 * `getQacDashboard()` (`src/lib/dashboards.ts`), read by
 * `/portal/dashboard/page.tsx`. Also rendered for `qac_admin`, which has no
 * dashboard frames of its own and shares this one.
 */
export default function QacPersonnelDashboard({
  data,
}: {
  data: { stats: Stat[]; copcSeries: number[] };
}) {
  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <section className="rounded-lg bg-maroon px-[26px] py-[20px] text-white shadow-card sm:h-[180px]">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC Dashboard!
        </h1>
        <p className="-mt-px text-subheading leading-none">
          Here, you can oversee, organize, and manage the entire accreditation
          process seamlessly.
        </p>
      </section>

      <div className="mt-[25px]">
        <StatRow stats={data.stats} />
      </div>

      <section className="relative mt-[26px] h-[320px] rounded-lg bg-white shadow-card">
        <h2 className="absolute left-[24px] top-[28px] text-subheading font-semibold leading-[22px] text-maroon">
          Overall Program
          <br />
          With Issued COPCs
        </h2>
        <CopcChart series={data.copcSeries} />
      </section>
    </div>
  );
}
