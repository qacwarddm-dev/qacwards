import CopcChart from "@/components/portal/CopcChart";
import { DASHBOARD_STATS } from "@/components/portal/data";
import { StatRow } from "@/components/portal/kit";

/**
 * QAC Personnel dashboard — assets/FIGMA/qac_personnel/01-Dashboard.png.
 * Paddings are back-solved from measured cap-top positions with the formula in
 * design/prototype-notes.md, so they will not look like round design numbers.
 */
export default function QacPersonnelDashboard() {
  return (
    <div className="px-[57px] pt-[45px] pb-[45px]">
      <section className="h-[180px] rounded-lg bg-maroon px-[26px] pt-[20px] text-white shadow-card">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC Dashboard!
        </h1>
        <p className="-mt-px text-subheading leading-none">
          Here, you can oversee, organize, and manage the entire accreditation
          process seamlessly.
        </p>
      </section>

      <div className="mt-[25px]">
        <StatRow stats={DASHBOARD_STATS} />
      </div>

      <section className="relative mt-[26px] h-[320px] rounded-lg bg-white shadow-card">
        <h2 className="absolute left-[24px] top-[28px] text-subheading font-semibold leading-[22px] text-maroon">
          Overall Program
          <br />
          With Issued COPCs
        </h2>
        <CopcChart />
      </section>
    </div>
  );
}
