import { ELIGIBLE_ACCREDITORS, NEW_ASSIGNMENT_FIELDS } from "../data";
import {
  BackLink,
  Button,
  Card,
  type Column,
  DataTable,
  FieldLabel,
  PanelHeader,
  SelectInput,
} from "../kit";

/** assets/FIGMA/qac_personnel/03.1-Create new assignment.png */
const COLUMNS: Column[] = [
  { key: "name", header: "Name", width: "w-[248px]" },
  { key: "expertise", header: "Expertise", width: "flex-1" },
  { key: "action", header: "Action", width: "w-[200px]" },
];

const FIELDS = NEW_ASSIGNMENT_FIELDS;

export default function QacPersonnelCreateAssignment() {
  const rows = ELIGIBLE_ACCREDITORS.map((a) => ({
    id: a.id,
    cells: {
      name: <span className="text-gray">{a.name}</span>,
      expertise: <span className="text-gray">{a.expertise}</span>,
      action: (
        <span className="flex justify-center">
          <Button variant="outline">Assign</Button>
        </span>
      ),
    },
  }));

  return (
    <div className="px-[57px] pb-[45px] pt-[32px]">
      <Card className="px-[44.5px] pb-[22px] pt-[28px]">
        <PanelHeader
          title="Accreditation Assignment"
          action={<BackLink href="/portal/assignment" />}
        />

        {/* Selection form */}
        <Card variant="outline" radius={16} className="mt-[19px] px-[44px] pb-[33px] pt-[26px]">
          <div className="grid grid-cols-2 gap-x-[60px] gap-y-[27px]">
            {[FIELDS.campus, FIELDS.department, FIELDS.program, FIELDS.level].map((f) => (
              <div key={f.label}>
                <FieldLabel>{f.label}</FieldLabel>
                <div className="mt-[13px]">
                  <SelectInput
                    label={f.label}
                    options={f.options}
                    defaultValue={f.defaultValue}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Eligible accreditors */}
        <Card variant="outline" radius={16} className="mt-[24px] px-[44px] pb-[18px] pt-[24px]">
          <h2 className="text-subheading font-semibold leading-none text-black">
            Eligible Accreditors
          </h2>
          <div className="mt-[18px]">
            <DataTable columns={COLUMNS} rows={rows} bodyRowH="h-[47px]" />
          </div>
        </Card>

        <div className="mt-[38px] flex justify-end">
          <Button variant="solid">Create Assignment</Button>
        </div>
      </Card>
    </div>
  );
}
