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

export async function sendMail(payload: MailPayload): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.log('[mail] skipped — no SMTP configured:', payload.subject, '->', payload.to);
    return;
  }

  const from = process.env.SMTP_FROM ?? 'UK2ME <no-reply@uk2meonline.com>';
  try {
    await transport.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  } catch (err) {
    _transport = null;
    console.error('[mail] send failed:', payload.subject, '->', payload.to, err);
  }
}
