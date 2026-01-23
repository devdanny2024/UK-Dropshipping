import nodemailer from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function getTransport() {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl && smtpUrl !== 'disabled') {
    return nodemailer.createTransport(smtpUrl);
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return null;
}

export async function sendMail(payload: MailPayload) {
  const transport = getTransport();
  if (!transport) {
    console.log('[mail] skipped (no SMTP config)', payload);
    return;
  }

  const from = process.env.SMTP_FROM ?? 'UK2ME <no-reply@uk2meonline.com>';
  await transport.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
}
