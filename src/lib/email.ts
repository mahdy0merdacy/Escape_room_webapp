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
    console.warn("[email] BREVO_API_KEY or BREVO_SENDER_EMAIL not set — skipping send");
    console.log(`[email stub] To: ${payload.to} | Subject: ${payload.subject}`);
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
    throw new Error(`Brevo send failed: ${res.status}`);
  }

  // Log to DB for audit trail (fire-and-forget, don't block response)
  prisma.emailLog
    .create({ data: { to: payload.to, subject: payload.subject, body: payload.textContent } })
    .catch(console.error);
}

// ── Email templates ───────────────────────────────────────────────────────────

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

  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const endStr = endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const textContent = `Hi ${customerName},

Your escape room booking is confirmed!

  Room:        ${roomName}
  Date:        ${dateStr}
  Time:        ${startStr} – ${endStr}
  Party size:  ${partySize} ${partySize === 1 ? "person" : "people"}
  Total due:   ${total} TND (payable at the venue)

Please arrive 10 minutes before your session for the briefing.

See you there!
— The elharba Team

📞 +216 28 720 530
📍 Manouba, Tunisia`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">

        <!-- Header -->
        <tr>
          <td style="background:#e11d48;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fecdd3;font-weight:600;">Escape Room</p>
            <h1 style="margin:8px 0 0;font-size:28px;font-weight:900;color:#fff;letter-spacing:2px;">elharba</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 6px;font-size:20px;color:#fff;">You&rsquo;re Booked! ✓</h2>
            <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${customerName}, your reservation is confirmed.</p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row("Room", roomName)}
                ${row("Date", dateStr)}
                ${row("Time", `${startStr} – ${endStr}`)}
                ${row("Party size", `${partySize} ${partySize === 1 ? "person" : "people"}`)}
                <tr style="border-top:1px solid #333;">
                  <td style="padding:14px 0 0;color:#888;font-size:13px;width:120px;">Total due</td>
                  <td style="padding:14px 0 0;font-size:20px;font-weight:800;color:#e11d48;">${total} TND</td>
                </tr>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;color:#888;font-size:13px;line-height:1.6;">
              Payment is collected <strong style="color:#f0f0f0;">at the venue</strong>. Please arrive <strong style="color:#f0f0f0;">10 minutes early</strong> for your briefing.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0"><tr><td style="background:#e11d48;border-radius:8px;">
              <a href="https://elharba.tn/contact" style="display:inline-block;padding:12px 28px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">
                Get Directions →
              </a>
            </td></tr></table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">📞 +216 28 720 530 &nbsp;·&nbsp; 📍 Manouba, Tunisia</p>
            <p style="margin:6px 0 0;color:#444;font-size:11px;">© ${new Date().getFullYear()} elharba. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    to: email,
    toName: customerName,
    subject: `Booking Confirmed — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent,
  };
}

export function bookingCancellationEmail(params: {
  customerName: string;
  email: string;
  roomName: string;
  startTime: Date;
}): EmailPayload {
  const { customerName, email, roomName, startTime } = params;
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const textContent = `Hi ${customerName},

Your booking for ${roomName} on ${dateStr} at ${startStr} has been cancelled.

If you have any questions, please contact us at +216 28 720 530 or reply to this email.

— The elharba Team`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
        <tr>
          <td style="background:#27272a;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a1a1aa;font-weight:600;">Escape Room</p>
            <h1 style="margin:8px 0 0;font-size:28px;font-weight:900;color:#fff;letter-spacing:2px;">elharba</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 6px;font-size:20px;color:#fff;">Booking Cancelled</h2>
            <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${customerName}, your reservation has been cancelled.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row("Room", roomName)}
                ${row("Date", dateStr)}
                ${row("Time", startStr)}
              </td></tr>
            </table>
            <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
              Questions? Call us at <strong style="color:#f0f0f0;">+216 28 720 530</strong> or reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">📞 +216 28 720 530 &nbsp;·&nbsp; 📍 Manouba, Tunisia</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    to: email,
    toName: customerName,
    subject: `Booking Cancelled — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:#888;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#f0f0f0;font-size:13px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}
