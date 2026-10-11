import { Fragment } from "react";
import { paginateCert, type CertCampus } from "@/lib/cert-model";

const smallCaps = (words: [string, string?][]) =>
  words.map(([head, rest], i) => (
    <Fragment key={i}>
      {i ? " " : ""}
      {head}
      {rest && <span>{rest}</span>}
    </Fragment>
  ));

export default function CertificationPaper({ campuses }: { campuses: CertCampus[] }) {
  const pages = paginateCert(campuses);
  const sheets = pages.length ? pages : [null];

  return (
    <div className="cwrap">
      {sheets.map((rows, i) => (
        <div key={i} className="cpage">
          <div className="cph">
            <img className="cs" src="/assets/portal/mockup/cert-seal.png" alt="" />
            <div className="ct">
              <small>REPUBLIC OF THE PHILIPPINES</small>
              <b>{smallCaps([["P", "OLYTECHNIC"], ["U", "NIVERSITY OF THE"], ["P", "HILIPPINES"]])}</b>
              <strong>OFFICE OF THE PRESIDENT</strong>
            </div>
            <img className="cb" src="/assets/portal/mockup/cert-bagong-pilipinas.png" alt="" />
          </div>
          <div className="cbody">
            <table className="ctab">
              <colgroup>
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "42.5%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th colSpan={2}>Program Name</th>
                  <th>Accreditation Status</th>
                  <th>Validity of Accreditation</th>
                  <th>Latest Date Visit</th>
                </tr>
                {rows ? (
                  rows.map((row, j) =>
                    row.kind === "program" ? (
                      row.program.statuses.map(([status, validity], k) => (
                        <tr key={`${j}-${k}`}>
                          {k === 0 && (
                            <>
                              <td className="cn" rowSpan={row.program.statuses.length}>
                                {row.program.no}.
                              </td>
                              <td className="cp" rowSpan={row.program.statuses.length}>
                                {row.program.name}
                              </td>
                            </>
                          )}
                          <td>{status}</td>
                          <td>{validity}</td>
                          {k === 0 && <td rowSpan={row.program.statuses.length}>{row.program.visit}</td>}
                        </tr>
                      ))
                    ) : (
                      <tr key={j} className={row.kind === "campus" ? "cc" : "ck"}>
                        <td colSpan={5}>
                          {row.label}
                          {row.continued && (
                            <>
                              {" "}
                              <i>(continued)</i>
                            </>
                          )}
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 14 }}>
                      No programs match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="cpf">
            <div>
              <small>
                PUP A. Mabini Campus, Anonas Street, Sta. Mesa, Manila 1016
                <br />
                Trunk Line: 5335-1787 or 5335-1777
                <br />
                Website: www.pup.edu.ph | Inquiries: https://bit.ly/PUPSINTA
              </small>
              <b>
                {smallCaps([["A"], ["L", "EADING"], ["C", "OMPREHENSIVE"]])}
                <br />
                {smallCaps([["P", "OLYTECHNIC"], ["U", "NIVERSITY IN"], ["A", "SIA"]])}
              </b>
            </div>
            <img src="/assets/portal/mockup/cert-footer.jpg" alt="" />
          </div>
          <div className="cpn">
            Page {i + 1} of {sheets.length}
          </div>
        </div>
      ))}
    </div>
  );
}
