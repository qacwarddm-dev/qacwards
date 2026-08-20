import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP, per the stack decision. Decision 14 approves four classes of mail —
 * account + password, assignment lifecycle, submission lifecycle, event notices
 * — and every one of them is enqueued by a Postgres trigger into
 * `email_outbox`. This module only knows how to *send*; what is worth sending is
 * decided in SQL (§8.5), so no route handler can forget to raise a mail.
 *
 * Configuration is entirely environmental. If SMTP is not configured the
 * transport is null and `sendMail` says so — the outbox row then records that as
 * its `last_error` rather than the queue silently draining into nothing.
 */

let cached: Transporter | null | undefined;

function transport(): Transporter | null {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    cached = null;
    return cached;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);

  cached = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Deriving it from the port
    // rather than asking for a third variable removes a way to misconfigure it.
    secure: port === 465,
    auth: { user, pass },
  });

  return cached;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendMail(
  to: string,
  subject: string,
  body: string,
): Promise<SendResult> {
  const tx = transport();
  if (!tx) {
    return { ok: false, error: "SMTP is not configured (SMTP_HOST/USER/PASS)." };
  }

  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text: body,
      html: htmlBody(subject, body),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Plain text is the payload; this is the same words in a readable frame. No
 *  images and no remote assets, so it renders the same in every client. */
function htmlBody(subject: string, body: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#1a1a1a">
  <p style="font-weight:bold;margin:0 0 12px">${esc(subject)}</p>
  <p style="margin:0 0 16px;white-space:pre-line">${esc(body)}</p>
  <p style="margin:0;color:#6b6b6b;font-size:12px">
    PUP Quality Assurance Center — this is an automated message.
  </p>
</div>`;
}
