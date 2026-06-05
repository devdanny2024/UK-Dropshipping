function clientUrl() {
  return process.env.CLIENT_URL ?? 'https://uk-dropshipping-client.vercel.app';
}

function layout(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F0EDF8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:32px 16px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #DDD6FE;">
<tr>
  <td style="background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 60%,#4C1D95 100%);padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="background:rgba(255,255,255,0.2);border-radius:8px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;">📦</div>
      <div style="color:#F59E0B;font-size:10px;letter-spacing:4px;font-weight:700;text-transform:uppercase;">UK2ME Online</div>
    </div>
    <div style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${heading}</div>
  </td>
</tr>
<tr>
  <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">${bodyHtml}</td>
</tr>
<tr>
  <td style="background:#F9F8FF;padding:20px 32px;border-top:1px solid #EDE9FE;">
    <p style="margin:0;color:#9181C2;font-size:12px;line-height:1.6;">
      Sent by <strong style="color:#7C3AED;">UK2ME Online</strong> &middot; Questions?
      <a href="mailto:support@uk2meonline.com" style="color:#7C3AED;text-decoration:none;">support@uk2meonline.com</a>
    </p>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function cta(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:20px;">${label}</a>`;
}

function orderRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 16px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;background:#f8fafc;">${label}</td>
      <td style="padding:12px 16px;font-weight:600;color:#5B21B6;font-size:14px;">${value}</td>
    </tr>`;
}

export function welcomeVerificationEmail(name: string, token: string) {
  const url = `${clientUrl()}/verify-email?token=${token}`;
  const displayName = name || 'there';
  const subject = 'Welcome to UK2ME Online — please verify your email';
  const html = layout(`Welcome aboard, ${displayName}!`, `
    <p style="margin:0 0 12px;">Your UK2ME account is ready. Shop from the UK or USA and get it delivered straight to your door.</p>
    <p style="margin:0 0 6px;font-weight:600;">Here is what you can do next:</p>
    <ul style="padding-left:20px;margin:8px 0 20px;color:#4b5563;">
      <li>Paste any UK or USA product link and get an instant quote.</li>
      <li>Track your order from purchase to delivery.</li>
      <li>Save multiple delivery addresses for fast checkout.</li>
    </ul>
    <p style="margin:0 0 4px;color:#374151;">First, please verify your email address to activate your account:</p>
    ${cta('Verify my email', url)}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
  `);
  const text = `Welcome to UK2ME Online, ${displayName}!\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.`;
  return { subject, html, text };
}

export function resendVerificationEmail(name: string, token: string) {
  const url = `${clientUrl()}/verify-email?token=${token}`;
  const subject = 'Verify your UK2ME Online email address';
  const html = layout('Verify your email', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, here is a fresh link to verify your email address and activate your account.</p>
    ${cta('Verify my email', url)}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">This link expires in 24 hours. If you did not request this, you can safely ignore it.</p>
  `);
  const text = `Verify your UK2ME email: ${url}\n\nThis link expires in 24 hours.`;
  return { subject, html, text };
}

export function forgotPasswordEmail(name: string, token: string) {
  const url = `${clientUrl()}/reset-password?token=${token}`;
  const subject = 'Reset your UK2ME Online password';
  const html = layout('Password reset request', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, we received a request to reset your UK2ME password.</p>
    ${cta('Reset my password', url)}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, your account is safe — you can ignore this email.</p>
  `);
  const text = `Reset your UK2ME password: ${url}\n\nThis link expires in 1 hour.`;
  return { subject, html, text };
}

export function orderReceivedEmail(name: string, orderId: string, total: number, currency: string) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const displayTotal = `${currency} ${total.toFixed(2)}`;
  const subject = `Order received — ${orderId}`;
  const html = layout('Order received!', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, we have received your order and are waiting to confirm your payment before we start processing it.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Total', displayTotal)}
    </table>
    <p style="margin:0 0 16px;color:#374151;">We will send you another email once payment is confirmed and your order starts processing.</p>
    ${cta('View my order', url)}
  `);
  const text = `Order received!\n\nOrder: ${orderId}\nTotal: ${displayTotal}\n\nView order: ${url}`;
  return { subject, html, text };
}

export function paymentConfirmedEmail(
  name: string,
  orderId: string,
  total: number,
  currency: string,
  provider: string
) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const displayTotal = `${currency} ${total.toFixed(2)}`;
  const providerLabel = provider === 'paystack' ? 'Paystack' : provider === 'stripe' ? 'Stripe' : provider;
  const subject = `Payment confirmed — Order ${orderId}`;
  const html = layout('Payment confirmed', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, your payment has been confirmed and your order is now being processed.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Amount paid', displayTotal)}
      ${orderRow('Payment via', providerLabel)}
    </table>
    <p style="margin:0 0 16px;color:#374151;">We will start sourcing your item from the UK or USA right away. You will hear from us when it ships.</p>
    ${cta('Track my order', url)}
  `);
  const text = `Payment confirmed for order ${orderId}.\nAmount: ${displayTotal} via ${providerLabel}.\n\nTrack order: ${url}`;
  return { subject, html, text };
}

const STATUS_COPY: Partial<Record<string, { headline: string; body: string; ctaLabel: string }>> = {
  AWAITING_PURCHASE: {
    headline: 'We are sourcing your item',
    body: 'We are now purchasing your item from the retailer. This usually takes 1–2 business days.',
    ctaLabel: 'View order',
  },
  SHIPPED: {
    headline: 'Your order is on its way!',
    body: 'Your order has been handed to the carrier and is heading to you. Check the link below for the latest updates.',
    ctaLabel: 'Track my order',
  },
  DELIVERED: {
    headline: 'Your order has been delivered',
    body: 'Your order has been delivered. We hope you love what you ordered! If there is any issue, please contact our support team.',
    ctaLabel: 'View order',
  },
  CANCELLED: {
    headline: 'Your order has been cancelled',
    body: 'Your order has been cancelled. If you believe this is a mistake or would like a refund, please contact our support team.',
    ctaLabel: 'Contact support',
  },
};

export function orderStatusEmail(name: string, orderId: string, status: string, note?: string) {
  const copy = STATUS_COPY[status];
  if (!copy) return null;

  const url = `${clientUrl()}/orders/${orderId}`;
  const subject = `${copy.headline} — Order ${orderId}`;
  const noteSection = note
    ? `<p style="margin:16px 0 0;padding:12px 16px;background:#f0f9ff;border-left:3px solid #0EA5E9;color:#374151;border-radius:0 4px 4px 0;font-size:14px;">${note}</p>`
    : '';
  const html = layout(copy.headline, `
    <p style="margin:0 0 8px;">Hi ${name || 'there'},</p>
    <p style="margin:0 0 0;color:#374151;">${copy.body}</p>
    ${noteSection}
    ${cta(copy.ctaLabel, url)}
    <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Order reference: ${orderId}</p>
  `);
  const text = `${copy.headline}\n\nOrder: ${orderId}\n${copy.body}${note ? '\n\nNote: ' + note : ''}\n\nView order: ${url}`;
  return { subject, html, text };
}

export function shipmentDispatchedEmail(
  name: string,
  orderId: string,
  carrier: string,
  trackingNumber: string
) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const subject = `Your order ${orderId} has shipped`;
  const html = layout('Your order is on its way!', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, great news — your order has been handed to the carrier and is on its way to you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Carrier', carrier)}
      ${orderRow('Tracking number', trackingNumber)}
    </table>
    <p style="margin:0 0 16px;color:#374151;">You can view your full order and track shipment progress using the button below.</p>
    ${cta('Track my order', url)}
  `);
  const text = `Your order ${orderId} has shipped!\n\nCarrier: ${carrier}\nTracking: ${trackingNumber}\n\nTrack: ${url}`;
  return { subject, html, text };
}

function adminUrl(): string {
  return process.env.ADMIN_URL ?? 'https://admin.uk2meonline.com';
}

// --- M2 R3: admin order-placed alert (with product links for self-review) ---
export function adminOrderPlacedEmail(orderId: string, region: string, productLinks: string[]) {
  const url = `${adminUrl()}/orders/${orderId}`;
  const subject = `New order ${orderId} (${region}) — review & price`;
  const links = productLinks.length
    ? `<ul style="padding-left:20px;margin:8px 0 16px;color:#4b5563;">${productLinks.map((l) => `<li><a href="${l}">${l}</a></li>`).join('')}</ul>`
    : '<p style="margin:0 0 16px;color:#64748b;">No product links on this order.</p>';
  const html = layout('New order to review', `
    <p style="margin:0 0 12px;">A new <strong>${region}</strong> order has been placed and is awaiting review/pricing.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Region', region)}
    </table>
    <p style="margin:0 0 6px;font-weight:600;">Product link(s):</p>
    ${links}
    ${cta('Open in admin', url)}
  `);
  const text = `New order ${orderId} (${region}).\nProduct links:\n${productLinks.join('\n')}\n\nAdmin: ${url}`;
  return { subject, html, text };
}

// --- M2 R4: invoice ready for the customer ---
export function invoiceReadyEmail(name: string, orderId: string, total: number, currency: string) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const displayTotal = `${currency} ${total.toFixed(2)}`;
  const subject = `Your invoice is ready — Order ${orderId}`;
  const html = layout('Your invoice is ready', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, your order has been priced and your invoice is ready. Review the full breakdown and pay to start processing.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Total due', displayTotal)}
    </table>
    ${cta('View & pay invoice', url)}
  `);
  const text = `Your invoice for order ${orderId} is ready.\nTotal due: ${displayTotal}\n\nView & pay: ${url}`;
  return { subject, html, text };
}

// --- M3 R9: manual weight pricing ---
export function weightPriceRequestedAdminEmail(orderId: string, items: { productUrl: string; category?: string }[]) {
  const url = `${adminUrl()}/weight-price-requests`;
  const subject = `Weight price requested — Order ${orderId}`;
  const list = `<ul style="padding-left:20px;margin:8px 0 16px;color:#4b5563;">${items
    .map((i) => `<li><a href="${i.productUrl}">${i.productUrl}</a>${i.category ? ` <em>(${i.category})</em>` : ''}</li>`)
    .join('')}</ul>`;
  const html = layout('Weight price requested', `
    <p style="margin:0 0 12px;">A customer needs a manual weight/delivery price for items in order <strong>${orderId}</strong> (no weight class on file). Please resolve so they can pay.</p>
    ${list}
    ${cta('Resolve weight prices', url)}
  `);
  const text = `Weight price requested for order ${orderId}:\n${items.map((i) => i.productUrl).join('\n')}\n\nResolve: ${url}`;
  return { subject, html, text };
}

export function weightPriceResolvedEmail(name: string, orderId: string) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const subject = `Your item is now priced — Order ${orderId}`;
  const html = layout('Your item is ready to pay for', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, we've worked out the delivery price for your item(s). Your order is now ready for payment.</p>
    ${cta('View & pay', url)}
  `);
  const text = `Your item in order ${orderId} is now priced and ready to pay.\n\nView: ${url}`;
  return { subject, html, text };
}

// --- M3 R10: complaints ---
export function complaintOpenedEmail(name: string, orderId: string) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const subject = `We've received your complaint — Order ${orderId}`;
  const html = layout('Complaint received', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, we've received your complaint about order ${orderId} and our team will review it shortly. We'll email you with any updates.</p>
    ${cta('View my order', url)}
  `);
  const text = `We've received your complaint about order ${orderId}. We'll be in touch.\n\nView: ${url}`;
  return { subject, html, text };
}

export function complaintOpenedAdminEmail(orderId: string, reason: string) {
  const url = `${adminUrl()}/complaints`;
  const subject = `New complaint — Order ${orderId}`;
  const html = layout('New complaint raised', `
    <p style="margin:0 0 12px;">A customer raised a complaint on order <strong>${orderId}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Order ID', orderId)}
      ${orderRow('Reason', reason)}
    </table>
    ${cta('Review complaints', url)}
  `);
  const text = `New complaint on order ${orderId}. Reason: ${reason}\n\nReview: ${url}`;
  return { subject, html, text };
}

export function complaintStatusEmail(name: string, orderId: string, status: string, note?: string) {
  const url = `${clientUrl()}/orders/${orderId}`;
  const subject = `Update on your complaint — Order ${orderId}`;
  const html = layout('Complaint update', `
    <p style="margin:0 0 12px;">Hi ${name || 'there'}, there's an update on your complaint for order ${orderId}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      ${orderRow('Status', status)}
      ${note ? orderRow('Note', note) : ''}
    </table>
    ${cta('View my order', url)}
  `);
  const text = `Complaint update for order ${orderId}: ${status}${note ? `\nNote: ${note}` : ''}\n\nView: ${url}`;
  return { subject, html, text };
}

// --- M3 R13: wallet credited (e.g. out of stock) ---
export function walletCreditedEmail(name: string, amount: number, currency: string, reason: string) {
  const url = `${clientUrl()}/wallet`;
  const display = `${currency} ${amount.toFixed(2)}`;
  const subject = `${display} credited to your UK2ME wallet`;
  const html = layout('Wallet credited', `
    <p style="margin:0 0 16px;">Hi ${name || 'there'}, we've added <strong>${display}</strong> to your UK2ME wallet${reason ? ` (${reason})` : ''}. You can spend this credit on your next order.</p>
    ${cta('View my wallet', url)}
  `);
  const text = `${display} has been credited to your UK2ME wallet${reason ? ` (${reason})` : ''}.\n\nView: ${url}`;
  return { subject, html, text };
}
