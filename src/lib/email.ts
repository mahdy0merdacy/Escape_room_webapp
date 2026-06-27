import prisma from "@/lib/prisma";
import { getTotalPrice } from "@/lib/pricing";

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "elharba";

  if (!apiKey || !senderEmail) {
    console.error(
      "[email] BREVO_API_KEY or BREVO_SENDER_EMAIL env var is missing — email NOT sent to:",
      payload.to,
      "|",
      payload.subject
    );
    return;
  }

  if (!payload.to) {
    console.error("[email] No recipient address — email NOT sent. Subject:", payload.subject);
    return;
  }

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: payload.to, name: payload.toName ?? payload.to }],
    subject: payload.subject,
    textContent: payload.textContent,
    ...(payload.htmlContent ? { htmlContent: payload.htmlContent } : {}),
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[email] Brevo error ${res.status}:`, err);
    throw new Error(`Brevo send failed: ${res.status} — ${err}`);
  }

  console.log(`[email] Sent to ${payload.to} — ${payload.subject}`);

  prisma.emailLog
    .create({ data: { to: payload.to, subject: payload.subject, body: payload.textContent } })
    .catch(console.error);
}

// ── Shared HTML helpers ───────────────────────────────────────────────────────

function detailRow(label: string, value: string) {
  return `
  <tr>
    <td style="padding:10px 24px;color:#777;font-size:13px;width:130px;border-bottom:1px solid #1e1e1e;vertical-align:top;">${label}</td>
    <td style="padding:10px 24px;color:#f0f0f0;font-size:13px;font-weight:600;border-bottom:1px solid #1e1e1e;vertical-align:top;">${value}</td>
  </tr>`;
}

function emailShell(headerBg: string, headerContent: string, bodyContent: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#111111;border-radius:12px;overflow:hidden;border:1px solid #222;">

        <!-- Header -->
        <tr>
          <td style="background:${headerBg};padding:28px 32px;">
            ${headerContent}
          </td>
        </tr>

        <!-- Body -->
        ${bodyContent}

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">📞 +216 28 720 530 &nbsp;·&nbsp; 📍 Manouba, Tunisia</p>
            <p style="margin:4px 0 0;color:#333;font-size:11px;">© ${new Date().getFullYear()} elharba Escape Room</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function bookingRequestReceivedEmail(params: {
  customerName: string;
  email: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  partySize: number;
}): EmailPayload {
  const { customerName, email, roomName, startTime, endTime, partySize } = params;

  const tz = "Africa/Tunis";
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const endStr = endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });

  const textContent = `Hi ${customerName},

We received your booking request!

  Room:        ${roomName}
  Date:        ${dateStr}
  Time:        ${startStr} – ${endStr}
  Party size:  ${partySize} ${partySize === 1 ? "person" : "people"}

We'll review it and send you a confirmation email shortly.
If you don't hear back within a few hours, give us a call: +216 28 720 530

— The elharba Team

📞 +216 28 720 530 · 📍 Manouba, Tunisia`;

  const header = `
    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fde68a;font-weight:600;">Request Received</p>
    <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

  const body = `
    <tr>
      <td style="padding:28px 32px 8px;">
        <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">We got your request!</h2>
        <p style="margin:0;color:#888;font-size:14px;">Hi ${customerName}, we'll confirm your slot shortly.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
          ${detailRow("Room", roomName)}
          ${detailRow("Date", dateStr)}
          ${detailRow("Time", `${startStr} – ${endStr}`)}
          ${detailRow("Party size", `${partySize} ${partySize === 1 ? "person" : "people"}`)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 32px;">
        <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
          You'll receive a second email once we confirm your booking.
          Need to reach us? Call <strong style="color:#f0f0f0;">+216 28 720 530</strong> or reply to this email.
        </p>
      </td>
    </tr>`;

  return {
    to: email,
    toName: customerName,
    subject: `Request Received — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent: emailShell("#92400e", header, body),
  };
}

export function bookingConfirmationEmail(params: {
  customerName: string;
  email: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  partySize: number;
  pricePerPerson: number;
}): EmailPayload {
  const { customerName, email, roomName, startTime, endTime, partySize } = params;
  const total = getTotalPrice(partySize);

  const tz = "Africa/Tunis";
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const endStr = endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });

  const textContent = `Hi ${customerName},

Your escape room booking is confirmed!

  Room:        ${roomName}
  Date:        ${dateStr}
  Time:        ${startStr} – ${endStr}
  Party size:  ${partySize} ${partySize === 1 ? "person" : "people"}
  Total due:   ${total} TND (pay at the venue)

Please arrive 10 minutes early for your briefing.

See you there!
— The elharba Team

📞 +216 28 720 530 · 📍 Manouba, Tunisia`;

  const header = `
    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fecdd3;font-weight:600;">Booking Confirmation</p>
    <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

  const body = `
    <tr>
      <td style="padding:28px 32px 8px;">
        <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">You're Booked! ✓</h2>
        <p style="margin:0;color:#888;font-size:14px;">Hi ${customerName}, your reservation is confirmed.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
          ${detailRow("Room", roomName)}
          ${detailRow("Date", dateStr)}
          ${detailRow("Time", `${startStr} – ${endStr}`)}
          ${detailRow("Party size", `${partySize} ${partySize === 1 ? "person" : "people"}`)}
          <tr>
            <td style="padding:14px 24px 14px;color:#888;font-size:13px;width:130px;vertical-align:middle;">Total due</td>
            <td style="padding:14px 24px 14px;font-size:22px;font-weight:900;color:#e11d48;vertical-align:middle;">${total} TND</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 8px;">
        <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
          Payment is collected <strong style="color:#f0f0f0;">at the venue</strong>.
          Please arrive <strong style="color:#f0f0f0;">10 minutes early</strong> for your briefing with our game master.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 32px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#e11d48;border-radius:8px;">
              <a href="https://elharba.tn/contact" style="display:inline-block;padding:13px 28px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">
                Get Directions →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return {
    to: email,
    toName: customerName,
    subject: `Booking Confirmed — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent: emailShell("#e11d48", header, body),
  };
}

export function bookingCancellationEmail(params: {
  customerName: string;
  email: string;
  roomName: string;
  startTime: Date;
}): EmailPayload {
  const { customerName, email, roomName, startTime } = params;
  const tz = "Africa/Tunis";
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });

  const textContent = `Hi ${customerName},

Your booking for ${roomName} on ${dateStr} at ${startStr} has been cancelled.

If you have questions, call us at +216 28 720 530 or reply to this email.

— The elharba Team`;

  const header = `
    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a1a1aa;font-weight:600;">Booking Update</p>
    <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

  const body = `
    <tr>
      <td style="padding:28px 32px 16px;">
        <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">Booking Cancelled</h2>
        <p style="margin:0;color:#888;font-size:14px;">Hi ${customerName}, your reservation has been cancelled.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
          ${detailRow("Room", roomName)}
          ${detailRow("Date", dateStr)}
          ${detailRow("Time", startStr)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
          Questions? Call us at <strong style="color:#f0f0f0;">+216 28 720 530</strong> or reply to this email.
        </p>
      </td>
    </tr>`;

  return {
    to: email,
    toName: customerName,
    subject: `Booking Cancelled — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent: emailShell("#27272a", header, body),
  };
}

export function newBookingAdminEmail(params: {
  customerName: string;
  email: string;
  phone: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  partySize: number;
  bookingId: string;
}): EmailPayload {
  const { customerName, email, phone, roomName, startTime, endTime, partySize, bookingId } = params;
  const total = getTotalPrice(partySize);
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://elharba.tn";

  const tz = "Africa/Tunis";
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const endStr = endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const ref = bookingId.slice(0, 8).toUpperCase();

  const textContent = `New booking #${ref}

  Room:       ${roomName}
  Date:       ${dateStr}
  Time:       ${startStr} – ${endStr}
  Party:      ${partySize} people
  Revenue:    ${total} TND

  Customer:   ${customerName}
  Email:      ${email}
  Phone:      ${phone}

Admin: ${siteUrl}/admin/bookings`;

  const header = `
    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fecdd3;font-weight:600;">Admin Notification</p>
    <h1 style="margin:6px 0 0;font-size:20px;font-weight:900;color:#fff;">🔔 New Booking — #${ref}</h1>`;

  const body = `
    <tr>
      <td style="padding:24px 32px 8px;">
        <p style="margin:0;color:#888;font-size:13px;">A new reservation was confirmed on elharba.</p>
      </td>
    </tr>

    <tr>
      <td style="padding:8px 32px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;font-weight:700;">Booking</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
          ${detailRow("Room", roomName)}
          ${detailRow("Date", dateStr)}
          ${detailRow("Time", `${startStr} – ${endStr}`)}
          ${detailRow("Party size", `${partySize} people`)}
          <tr>
            <td style="padding:14px 24px;color:#888;font-size:13px;width:130px;">Revenue</td>
            <td style="padding:14px 24px;font-size:20px;font-weight:900;color:#e11d48;">${total} TND</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;font-weight:700;">Customer</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
          ${detailRow("Name", customerName)}
          ${detailRow("Email", `<a href="mailto:${email}" style="color:#e11d48;text-decoration:none;">${email}</a>`)}
          ${detailRow("Phone", `<a href="tel:${phone}" style="color:#e11d48;text-decoration:none;">${phone}</a>`)}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 32px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#e11d48;border-radius:8px;">
              <a href="${siteUrl}/admin/bookings" style="display:inline-block;padding:13px 28px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">
                View in Admin →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return {
    to: adminEmail,
    toName: "elharba Admin",
    subject: `🔔 New Booking #${ref} — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent: emailShell("#e11d48", header, body),
  };
}
