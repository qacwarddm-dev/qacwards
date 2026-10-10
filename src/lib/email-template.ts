export type EmailSpec =
  | { kind: "code"; code: string; minutes: number }
  | { kind: "invite"; name: string; role: string; email: string; link: string };

type Tone = { ink: string; soft: string; text: string };

const MAROON = "#800000";
const MAROON_DEEP = "#5c0000";
const FOIL = "#EFBF04";
const GOLD_SOFT = "#fff6d6";
const INK = "#111111";
const MUTED = "#6b6b6b";
const LINE = "#e5e5e5";
const PAGE = "#f3f3f3";

const TONES = {
  maroon: { ink: MAROON, soft: GOLD_SOFT, text: MAROON },
  gold: { ink: "#eab308", soft: GOLD_SOFT, text: MAROON_DEEP },
  green: { ink: "#22a33a", soft: "#e9f7ec", text: "#22a33a" },
  red: { ink: "#c62828", soft: "#fdecec", text: "#c62828" },
  blue: { ink: "#1f4fa3", soft: "#e8eefb", text: "#1f4fa3" },
} satisfies Record<string, Tone>;

const SERIF = "'Roboto Serif',Georgia,'Times New Roman',serif";
const DISPLAY = "'Playfair Display SC','Playfair Display',Georgia,serif";
const LABEL = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";
const BODY = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";
const FOOT = "'Inria Serif',Georgia,serif";

const SITE = (process.env.SITE_URL ?? "https://qacwards.vercel.app").replace(/\/$/, "");

// Subjects come from SQL triggers as whole sentences; the prefix becomes the eyebrow so the headline reads clean.
const NOTICE_RULES: { test: RegExp; eyebrow: string; tone: keyof typeof TONES; lede: string; strip?: boolean }[] = [
  { test: /^Needs revision:\s*/i, eyebrow: "Needs revision", tone: "red", strip: true, lede: "A reviewer sent this document back. Read the note, revise, and upload it again." },
  { test: /^Submission returned:\s*/i, eyebrow: "Submission returned", tone: "red", strip: true, lede: "Your accreditor returned this submission. Address the note below, then resubmit from the portal." },
  { test: /disapproved/i, eyebrow: "Document disapproved", tone: "red", lede: "One of your submitted documents did not pass review. The reason is below." },
  { test: /^Submission filed:\s*/i, eyebrow: "Submission filed", tone: "blue", strip: true, lede: "A program has filed its accreditation submission and it is ready for QAC review." },
  { test: /^Resubmitted:\s*/i, eyebrow: "Resubmitted", tone: "blue", strip: true, lede: "The program responded to your return note. The revised submission is waiting for you." },
  { test: /^NDA for review:\s*/i, eyebrow: "NDA for review", tone: "gold", strip: true, lede: "A signed non-disclosure agreement was uploaded and needs verification." },
  { test: /^Evaluation submitted:\s*/i, eyebrow: "Evaluation submitted", tone: "green", strip: true, lede: "An accreditor signed and submitted their evaluation report." },
  { test: /^New program added:\s*/i, eyebrow: "New program", tone: "maroon", strip: true, lede: "A new academic program was added to QAC-WARDS." },
  { test: /result has been released/i, eyebrow: "Result released", tone: "green", lede: "The Quality Assurance Center has released the outcome of your program&rsquo;s accreditation." },
  { test: /new accreditation assignment/i, eyebrow: "New assignment", tone: "maroon", lede: "You were named an accreditor for the program below. Accept or decline it from your assignments." },
  { test: / accepted an assignment$/i, eyebrow: "Assignment accepted", tone: "green", lede: "Your accreditor confirmed the assignment. The evaluation can proceed." },
  { test: / rejected an assignment$/i, eyebrow: "Assignment declined", tone: "red", lede: "Your accreditor declined the assignment. You may need to assign someone else." },
  { test: / expires soon$/i, eyebrow: "Validity watch", tone: "gold", lede: "Your program&rsquo;s accreditation is nearing its end date. File for revalidation in time." },
  { test: /invited to QAC-WARDS/i, eyebrow: "Invitation", tone: "maroon", lede: "The PUP Quality Assurance Center invited you to QAC-WARDS." },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const today = () =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date());

function eyebrow(label: string, tone: Tone): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background:${tone.soft};border-radius:999px;padding:6px 14px 6px 12px;font-family:${LABEL};font-size:10px;line-height:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${tone.text};mso-line-height-rule:exactly">
<span style="color:${tone.ink};font-size:12px">&#9670;</span>&nbsp;&nbsp;${esc(label)}</td></tr></table>`;
}

function headline(text: string): string {
  const size = text.length > 64 ? 20 : 31;
  return `<h1 style="margin:22px 0 0;font-family:${SERIF};font-size:${size}px;line-height:${Math.round(size * 1.22)}px;font-weight:600;letter-spacing:-0.3px;color:${INK}">${esc(text)}</h1>`;
}

function lede(html: string): string {
  return `<p style="margin:14px 0 0;font-family:${BODY};font-size:15px;line-height:24px;color:${MUTED}">${html}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px"><tr><td align="center">
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr>
<td bgcolor="${MAROON}" style="border-radius:10px;background:${MAROON};background-image:linear-gradient(135deg,${MAROON},${MAROON_DEEP});border-bottom:3px solid ${FOIL}">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${LABEL};font-size:15px;line-height:18px;font-weight:600;letter-spacing:0.3px;color:#ffffff;text-decoration:none">${esc(label)}&nbsp;&nbsp;&rarr;</a>
</td></tr></table>
</td></tr></table>`;
}

function codeBlock(code: string, minutes: number): string {
  const cells = code
    .split("")
    .map(
      (d) => `<td class="qd" width="54" align="center" valign="middle" bgcolor="${GOLD_SOFT}" style="width:54px;height:68px;background:${GOLD_SOFT};border:1px solid ${FOIL};border-bottom:3px solid ${MAROON};border-radius:10px;font-family:${SERIF};font-size:36px;line-height:68px;font-weight:600;color:${MAROON}">${esc(d)}</td>`,
    )
    .join(`<td class="qg" width="8" style="width:8px;font-size:0;line-height:0">&nbsp;</td>`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px"><tr><td align="center">
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr>${cells}</tr></table>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 0"><tr>
<td style="font-family:${LABEL};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Valid for</td>
<td style="padding-left:10px;font-family:${SERIF};font-size:15px;line-height:14px;font-weight:600;color:${INK}">${minutes} minutes</td>
<td style="padding-left:14px;font-family:${LABEL};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MUTED}">&middot;&nbsp;&nbsp;Single use</td>
</tr></table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px"><tr>
<td style="background:${PAGE};border-radius:10px;padding:16px 18px;font-family:${BODY};font-size:12px;line-height:19px;color:${MUTED}">
<strong style="color:${INK}">Didn&rsquo;t ask for this?</strong> Someone may have typed your address by mistake. No account is created until the code is entered, so you can safely ignore this email.</td>
</tr></table>`;
}

function inviteBlock(spec: Extract<EmailSpec, { kind: "invite" }>): string {
  const row = (k: string, v: string, last = false) => `<tr>
<td style="padding:13px 0;${last ? "" : `border-bottom:1px dashed ${LINE};`}font-family:${LABEL};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MUTED};white-space:nowrap;padding-right:14px" width="96">${k}</td>
<td style="padding:13px 0;${last ? "" : `border-bottom:1px dashed ${LINE};`}font-family:${BODY};font-size:15px;line-height:20px;color:${INK};word-break:break-word">${v}</td></tr>`;

  const step = (n: string, title: string, text: string) => `<tr>
<td width="44" valign="top" style="padding:0 0 16px;font-family:${SERIF};font-size:20px;line-height:24px;font-weight:600;color:${FOIL}">${n}</td>
<td valign="top" style="padding:0 0 16px;font-family:${BODY};font-size:15px;line-height:22px;color:${INK}"><strong style="font-weight:600">${title}</strong><br><span style="font-size:12px;line-height:18px;color:${MUTED}">${text}</span></td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;border:1px solid ${LINE};border-left:8px solid ${MAROON};border-radius:16px;border-collapse:separate"><tr>
<td style="border-left:2px solid ${FOIL};padding:8px 22px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${row("Role", `<span style="font-family:${SERIF};font-weight:600;color:${MAROON}">${esc(spec.role)}</span>`)}
${row("Account", `<a href="mailto:${esc(spec.email)}" style="color:${INK};text-decoration:none">${esc(spec.email)}</a>`)}
${row("Issued by", "PUP Quality Assurance Center", true)}
</table></td></tr></table>
${button(spec.link, "Create your account")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px">
<tr><td colspan="2" style="padding-bottom:16px;font-family:${LABEL};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MUTED}">What happens next</td></tr>
${step("I", "Open your invitation", "The link above opens registration with this email already filled in.")}
${step("II", "Verify your email", "We send a 6-digit code to this inbox to confirm it&rsquo;s you.")}
${step("III", "Set your password", "Your account is saved and you can sign in to the portal.")}
</table>
<p style="margin:8px 0 0;font-family:${BODY};font-size:12px;line-height:18px;color:${MUTED}">Button not working? Paste this into your browser:<br>
<a href="${esc(spec.link)}" style="color:${MAROON};word-break:break-all">${esc(spec.link)}</a></p>`;
}

function noticeBlock(body: string, tone: Tone): string {
  const link = body.match(/https?:\/\/\S+/)?.[0];
  const text = body.replace(/https?:\/\/\S+/g, "").trim();
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => `<p style="margin:${i ? 12 : 0}px 0 0;font-family:${BODY};font-size:15px;line-height:24px;color:${INK};white-space:pre-line">${esc(p)}</p>`)
    .join("");

  const detail = paras
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:separate"><tr>
<td width="4" bgcolor="${tone.ink}" style="width:4px;background:${tone.ink};border-radius:4px 0 0 4px;font-size:0">&nbsp;</td>
<td bgcolor="${tone.soft}" style="background:${tone.soft};border-radius:0 10px 10px 0;padding:18px 22px">
<div style="margin-bottom:8px;font-family:${LABEL};font-size:10px;line-height:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${tone.text}">Details</div>
${paras}</td></tr></table>`
    : "";

  return detail + button(link ?? `${SITE}/portal`, link ? "Open link" : "Open in QAC-WARDS");
}

function frame(opts: { preheader: string; content: string }): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>QAC-WARDS</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display+SC:wght@400;700&family=Poppins:wght@500;600&family=Roboto+Serif:opsz,wght@8..144,600&family=Inria+Serif:ital@1&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%}
  a{text-decoration:none}
  @media (max-width:620px){
    .qw{width:100%!important}
    .qp{padding-left:24px!important;padding-right:24px!important}
    .qd{width:40px!important;height:56px!important;font-size:28px!important;line-height:56px!important}
    .qg{width:5px!important}
    .qhide{display:none!important}
    .qsub{letter-spacing:0.5px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAGE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(opts.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background:${PAGE}"><tr><td align="center" style="padding:32px 12px 40px">

<table role="presentation" class="qw" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">
<tr><td style="padding:0 6px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${LABEL};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MAROON}">QAC-WARDS</td>
<td align="right" style="font-family:${LABEL};font-size:10px;line-height:14px;font-weight:500;letter-spacing:1px;color:${MUTED}">${today()}</td>
</tr></table></td></tr>

<tr><td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

<tr><td bgcolor="${MAROON}" class="qp" style="background:${MAROON};background-image:linear-gradient(135deg,${MAROON} 0%,${MAROON_DEEP} 100%);border-radius:15px 15px 0 0;padding:26px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="60" valign="middle" style="width:60px">
<img src="${SITE}/assets/logos/pup.png" width="52" height="52" alt="PUP" style="display:block;width:52px;height:52px;border:2px solid ${FOIL};border-radius:999px;background:#ffffff">
</td>
<td valign="middle" style="padding-left:14px">
<div class="qsub" style="font-family:${DISPLAY};font-size:10px;line-height:14px;letter-spacing:1.5px;color:${FOIL}">Polytechnic University of the Philippines</div>
<div style="padding-top:3px;font-family:${DISPLAY};font-size:20px;line-height:24px;font-weight:700;letter-spacing:0.4px;color:#ffffff">Quality Assurance Center</div>
</td>
<td align="right" valign="middle" class="qhide">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border:1px solid ${FOIL};border-radius:999px;padding:6px 12px;font-family:${LABEL};font-size:10px;line-height:12px;font-weight:600;letter-spacing:2px;color:${FOIL}">EST. 1904</td>
</tr></table></td>
</tr></table></td></tr>

<tr><td height="3" bgcolor="${FOIL}" style="height:3px;background:${FOIL};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td height="3" style="height:3px;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td height="1" bgcolor="${FOIL}" style="height:1px;background:${FOIL};font-size:0;line-height:0">&nbsp;</td></tr>

<tr><td class="qp" style="padding:40px 44px 8px">
${opts.content}
</td></tr>

<tr><td class="qp" style="padding:36px 44px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-top:1px solid ${LINE};padding-top:22px">
<div style="font-family:${FOOT};font-style:italic;font-size:15px;line-height:20px;color:${MAROON}">&mdash; Quality Assurance Center</div>
<div style="padding-top:4px;font-family:${BODY};font-size:12px;line-height:18px;color:${MUTED}">Polytechnic University of the Philippines</div>
</td></tr></table></td></tr>

</table></td></tr>

<tr><td align="center" style="padding:26px 24px 0">
<div style="font-family:${SERIF};font-size:12px;line-height:12px;letter-spacing:10px;color:${FOIL}">&#9670;&#9670;&#9670;</div>
<div style="padding-top:14px;font-family:${FOOT};font-size:12px;line-height:19px;color:${MUTED}">This is an automated message from QAC-WARDS,<br>the accreditation workflow of the PUP Quality Assurance Center.</div>
</td></tr>
</table>

</td></tr></table>
</body>
</html>`;
}

export function renderEmail(subject: string, body: string, spec?: EmailSpec): string {
  if (spec?.kind === "code") {
    return frame({
      preheader: `Your QAC-WARDS code is ${spec.code}. It expires in ${spec.minutes} minutes.`,
      content:
        eyebrow("Verification", TONES.maroon) +
        headline("Confirm it’s you") +
        lede("Enter this code on the registration page to verify your email and continue setting up your QAC-WARDS account.") +
        codeBlock(spec.code, spec.minutes),
    });
  }

  if (spec?.kind === "invite") {
    return frame({
      preheader: `The PUP Quality Assurance Center invited you to QAC-WARDS as ${spec.role}.`,
      content:
        eyebrow("Invitation", TONES.maroon) +
        headline(`Welcome aboard, ${spec.name}.`) +
        lede(`The PUP Quality Assurance Center has invited you to <strong style="color:${INK};font-weight:600">QAC-WARDS</strong>, the university&rsquo;s accreditation workflow. Your seat is reserved.`) +
        inviteBlock(spec),
    });
  }

  const clean = subject.replace(/^\[QAC-WARDS\]\s*/, "");
  const rule = NOTICE_RULES.find((r) => r.test.test(clean));
  const tone = TONES[rule?.tone ?? "maroon"];
  const title = rule?.strip ? clean.replace(rule.test, "") || clean : clean;
  const detail = body.trim() === subject.trim() ? "" : body;

  return frame({
    preheader: detail ? detail.replace(/\s+/g, " ").slice(0, 140) : clean,
    content:
      eyebrow(rule?.eyebrow ?? "Notice", tone) +
      headline(title) +
      lede(rule?.lede ?? "There&rsquo;s an update for you in QAC-WARDS.") +
      noticeBlock(detail, tone),
  });
}
