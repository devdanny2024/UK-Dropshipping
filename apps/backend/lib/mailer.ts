import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

let _transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (_transport) return _transport;

  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl && smtpUrl !== 'disabled') {
    _transport = nodemailer.createTransport(smtpUrl);
    return _transport;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    _transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return _transport;
  }

  return null;
}

export type MailResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Send an email. Reliability (M2 R5): retries once on failure, never throws, and
 * returns a status so callers can record success/failure (e.g. on an OrderEvent)
 * instead of silently dropping mail. Backward compatible — existing callers that
 * ignore the return value are unaffected.
 */
export async function sendMail(payload: MailPayload): Promise<MailResult> {
  const transport = getTransport();
  if (!transport) {
    console.log('[mail] skipped — no SMTP configured:', payload.subject, '->', payload.to);
    return { ok: false, skipped: true };
  }

  const from = process.env.SMTP_FROM ?? 'UK2ME <no-reply@uk2meonline.com>';
  const message = { from, to: payload.to, subject: payload.subject, text: payload.text, html: payload.html };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await transport.sendMail(message);
      if (attempt > 1) console.log('[mail] sent on retry:', payload.subject, '->', payload.to);
      return { ok: true };
    } catch (err) {
      _transport = null;
      console.error(`[mail] send failed (attempt ${attempt}/2):`, payload.subject, '->', payload.to, err);
      if (attempt === 2) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      // rebuild transport for the retry
      getTransport();
    }
  }
  return { ok: false, error: 'unreachable' };
}
