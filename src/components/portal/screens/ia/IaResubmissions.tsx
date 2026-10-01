import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Scope from "../../kit/Scope";

export type ResubRow = {
  key: string;
  file: string;
  version: number;
  context: string;
  remark: string;
  date: string;
  href: string;
};

export default function IaResubmissions({ rows }: { rows: ResubRow[] }) {
  return (
    <Scope name="ia">
      <Card>
        <h2>Resubmissions to re-check</h2>
        <table>
          <tbody>
            <tr>
              <th>Document</th>
              <th>Program · Area</th>
              <th>Your remark</th>
              <th>Resubmitted</th>
              <th />
            </tr>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  {r.file}
                  <small>Version {r.version}</small>
                </td>
                <td>{r.context}</td>
                <td>{r.remark}</td>
                <td>{r.date}</td>
                <td>
                  <Btn href={r.href}>Re-check</Btn>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>
                  <div className="ph">Nothing to re-check. Documents you return show up here once the program uploads a new version.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </Scope>
  );
}
