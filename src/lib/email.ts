import prisma from "@/lib/prisma";
import { getTotalPrice } from "@/lib/pricing";

export type Locale = "en" | "ar" | "fr";

export interface EmailPayload {
  to: string;
  toName?: string;
  cc?: string[];
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
    ...(payload.cc?.length ? { cc: payload.cc.map((e) => ({ email: e })) } : {}),
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

// ── Date/time helpers ─────────────────────────────────────────────────────────

const TZ = "Africa/Tunis";

function fmtDate(date: Date, locale: Locale) {
  const l = locale === "ar" ? "ar-TN-u-nu-latn" : locale === "fr" ? "fr-TN" : "en-US";
  return date.toLocaleDateString(l, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: TZ });
}

function fmtTime(date: Date, locale: Locale) {
  const l = locale === "ar" ? "ar-TN-u-nu-latn" : locale === "fr" ? "fr-TN" : "en-US";
  return date.toLocaleTimeString(l, { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

function detailRow(label: string, value: string, rtl = false) {
  const align = rtl ? "right" : "left";
  return `
  <tr>
    <td style="padding:10px 24px;color:#777;font-size:13px;width:140px;border-bottom:1px solid #1e1e1e;vertical-align:top;text-align:${align};">${label}</td>
    <td style="padding:10px 24px;color:#f0f0f0;font-size:13px;font-weight:600;border-bottom:1px solid #1e1e1e;vertical-align:top;text-align:${align};">${value}</td>
  </tr>`;
}

function emailShell(
  headerBg: string,
  headerContent: string,
  bodyContent: string,
  lang = "en",
  dir: "ltr" | "rtl" = "ltr"
) {
  const textAlign = dir === "rtl" ? "right" : "center";
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;" dir="${dir}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 16px;" dir="${dir}">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#111111;border-radius:12px;overflow:hidden;border:1px solid #222;" dir="${dir}">

        <!-- Header -->
        <tr>
          <td style="background:${headerBg};padding:28px 32px;text-align:${textAlign};">
            ${headerContent}
          </td>
        </tr>

        <!-- Body -->
        ${bodyContent}

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">📞 +216 28 720 530 &nbsp;·&nbsp; 📍 ${lang === "ar" ? "منوبة، تونس" : lang === "fr" ? "Manouba, Tunisie" : "Manouba, Tunisia"}</p>
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
  locale?: Locale;
}): EmailPayload {
  const { customerName, email, roomName, startTime, endTime, partySize, locale = "en" } = params;
  const rtl = locale === "ar";

  const dateStr = fmtDate(startTime, locale);
  const startStr = fmtTime(startTime, locale);
  const endStr = fmtTime(endTime, locale);

  if (locale === "ar") {
    const partyLabel = `${partySize} ${partySize === 1 ? "شخص" : "أشخاص"}`;
    const textContent = `أهلاً ${customerName}،

تم استلام طلب حجزك!

  الغرفة:       ${roomName}
  التاريخ:      ${dateStr}
  الوقت:        ${startStr} – ${endStr}
  عدد اللاعبين: ${partyLabel}

سنتواصل معك قريباً لتأكيد الموعد.
للاستفسار: +216 28 720 530

— فريق الحربة`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#fde68a;font-weight:600;">طلب مستلم</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">الحربة</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 8px;text-align:right;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">لقد تلقّينا طلبك!</h2>
          <p style="margin:0;color:#888;font-size:14px;">أهلاً ${customerName}، سنتواصل معك قريباً لتأكيد موعدك.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;" dir="rtl">
            ${detailRow("غرفة", roomName, rtl)}
            ${detailRow("التاريخ", dateStr, rtl)}
            ${detailRow("الوقت", `${startStr} – ${endStr}`, rtl)}
            ${detailRow("عدد اللاعبين", partyLabel, rtl)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 32px;text-align:right;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.8;">
            ستصلك رسالة تأكيد بمجرد مراجعة الطلب.
            للاستفسار، اتصل بنا على <strong style="color:#f0f0f0;">+216 28 720 530</strong> أو أجب على هذا البريد الإلكتروني.
          </p>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `تم استلام طلبك — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#92400e", header, body, "ar", "rtl"),
    };
  }

  if (locale === "fr") {
    const partyLabel = `${partySize} ${partySize === 1 ? "personne" : "personnes"}`;
    const textContent = `Bonjour ${customerName},

Votre demande de réservation a bien été reçue !

  Salle :       ${roomName}
  Date :        ${dateStr}
  Heure :       ${startStr} – ${endStr}
  Groupe :      ${partyLabel}

Nous vous confirmerons votre créneau très prochainement.
Pour toute question : +216 28 720 530

— L'équipe elharba`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fde68a;font-weight:600;">Demande Reçue</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 8px;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">Demande bien reçue !</h2>
          <p style="margin:0;color:#888;font-size:14px;">Bonjour ${customerName}, nous confirmerons votre créneau très prochainement.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
            ${detailRow("Salle", roomName)}
            ${detailRow("Date", dateStr)}
            ${detailRow("Heure", `${startStr} – ${endStr}`)}
            ${detailRow("Groupe", partyLabel)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 32px;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
            Vous recevrez un e-mail de confirmation dès validation.
            Des questions ? Appelez-nous au <strong style="color:#f0f0f0;">+216 28 720 530</strong> ou répondez à cet e-mail.
          </p>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `Demande reçue — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#92400e", header, body, "fr"),
    };
  }

  // English (default)
  const partyLabel = `${partySize} ${partySize === 1 ? "person" : "people"}`;
  const textContent = `Hi ${customerName},

We received your booking request!

  Room:        ${roomName}
  Date:        ${dateStr}
  Time:        ${startStr} – ${endStr}
  Party size:  ${partyLabel}

We'll review it and send you a confirmation email shortly.
If you don't hear back within a few hours, give us a call: +216 28 720 530

— The elharba Team`;

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
          ${detailRow("Party size", partyLabel)}
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
  locale?: Locale;
}): EmailPayload {
  const { customerName, email, roomName, startTime, endTime, partySize, locale = "en" } = params;
  const rtl = locale === "ar";
  const total = getTotalPrice(partySize);

  const dateStr = fmtDate(startTime, locale);
  const startStr = fmtTime(startTime, locale);
  const endStr = fmtTime(endTime, locale);

  if (locale === "ar") {
    const partyLabel = `${partySize} ${partySize === 1 ? "شخص" : "أشخاص"}`;
    const textContent = `أهلاً ${customerName}،

تم تأكيد حجزك في غرفة الهروب!

  الغرفة:       ${roomName}
  التاريخ:      ${dateStr}
  الوقت:        ${startStr} – ${endStr}
  عدد اللاعبين: ${partyLabel}
  المبلغ:       ${total} دينار (الدفع عند الوصول)

يُرجى الحضور قبل 10 دقائق من الموعد للاستماع إلى الإحاطة.

نراك قريباً!
— فريق الحربة`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#fecdd3;font-weight:600;">تأكيد الحجز</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">الحربة</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 8px;text-align:right;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">تم تأكيد حجزك ✓</h2>
          <p style="margin:0;color:#888;font-size:14px;">أهلاً ${customerName}، حجزك مؤكّد.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;" dir="rtl">
            ${detailRow("غرفة", roomName, rtl)}
            ${detailRow("التاريخ", dateStr, rtl)}
            ${detailRow("الوقت", `${startStr} – ${endStr}`, rtl)}
            ${detailRow("عدد اللاعبين", partyLabel, rtl)}
            <tr>
              <td style="padding:14px 24px;color:#888;font-size:13px;width:140px;text-align:right;">المبلغ</td>
              <td style="padding:14px 24px;font-size:22px;font-weight:900;color:#e11d48;text-align:right;">${total} دينار</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 8px;text-align:right;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.8;">
            الدفع يكون <strong style="color:#f0f0f0;">عند الوصول</strong>.
            يُرجى الحضور <strong style="color:#f0f0f0;">قبل 10 دقائق</strong> للاستماع إلى الإحاطة مع مدير اللعبة.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:right;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#e11d48;border-radius:8px;">
                <a href="https://elharba.tn/contact" style="display:inline-block;padding:13px 28px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">
                  احصل على الاتجاهات →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `تأكيد الحجز — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#e11d48", header, body, "ar", "rtl"),
    };
  }

  if (locale === "fr") {
    const partyLabel = `${partySize} ${partySize === 1 ? "personne" : "personnes"}`;
    const textContent = `Bonjour ${customerName},

Votre réservation de salle d'évasion est confirmée !

  Salle :       ${roomName}
  Date :        ${dateStr}
  Heure :       ${startStr} – ${endStr}
  Groupe :      ${partyLabel}
  Total :       ${total} TND (règlement sur place)

Merci d'arriver 10 minutes à l'avance pour le briefing.

À bientôt !
— L'équipe elharba`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fecdd3;font-weight:600;">Réservation Confirmée</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 8px;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">Réservation confirmée ✓</h2>
          <p style="margin:0;color:#888;font-size:14px;">Bonjour ${customerName}, votre réservation est confirmée.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
            ${detailRow("Salle", roomName)}
            ${detailRow("Date", dateStr)}
            ${detailRow("Heure", `${startStr} – ${endStr}`)}
            ${detailRow("Groupe", partyLabel)}
            <tr>
              <td style="padding:14px 24px;color:#888;font-size:13px;width:140px;">Total dû</td>
              <td style="padding:14px 24px;font-size:22px;font-weight:900;color:#e11d48;">${total} TND</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 8px;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
            Le règlement s'effectue <strong style="color:#f0f0f0;">sur place</strong>.
            Merci d'arriver <strong style="color:#f0f0f0;">10 minutes à l'avance</strong> pour le briefing avec votre game master.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#e11d48;border-radius:8px;">
                <a href="https://elharba.tn/contact" style="display:inline-block;padding:13px 28px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">
                  Voir l'itinéraire →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `Réservation confirmée — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#e11d48", header, body, "fr"),
    };
  }

  // English (default)
  const partyLabel = `${partySize} ${partySize === 1 ? "person" : "people"}`;
  const textContent = `Hi ${customerName},

Your escape room booking is confirmed!

  Room:        ${roomName}
  Date:        ${dateStr}
  Time:        ${startStr} – ${endStr}
  Party size:  ${partyLabel}
  Total due:   ${total} TND (pay at the venue)

Please arrive 10 minutes early for your briefing.

See you there!
— The elharba Team`;

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
          ${detailRow("Party size", partyLabel)}
          <tr>
            <td style="padding:14px 24px 14px;color:#888;font-size:13px;width:140px;vertical-align:middle;">Total due</td>
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
  locale?: Locale;
}): EmailPayload {
  const { customerName, email, roomName, startTime, locale = "en" } = params;
  const rtl = locale === "ar";

  const dateStr = fmtDate(startTime, locale);
  const startStr = fmtTime(startTime, locale);

  if (locale === "ar") {
    const textContent = `أهلاً ${customerName}،

تم إلغاء حجزك في ${roomName} بتاريخ ${dateStr} الساعة ${startStr}.

هل لديك أي تساؤلات؟ اتصل بنا على +216 28 720 530 أو أجب على هذا البريد الإلكتروني.

— فريق الحربة`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a1a1aa;font-weight:600;">تحديث الحجز</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">الحربة</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 16px;text-align:right;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">تم إلغاء الحجز</h2>
          <p style="margin:0;color:#888;font-size:14px;">أهلاً ${customerName}، تم إلغاء حجزك.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;" dir="rtl">
            ${detailRow("غرفة", roomName, rtl)}
            ${detailRow("التاريخ", dateStr, rtl)}
            ${detailRow("الوقت", startStr, rtl)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;text-align:right;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.8;">
            هل لديك أي تساؤلات؟ اتصل بنا على <strong style="color:#f0f0f0;">+216 28 720 530</strong> أو أجب على هذا البريد الإلكتروني.
          </p>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `إلغاء الحجز — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#27272a", header, body, "ar", "rtl"),
    };
  }

  if (locale === "fr") {
    const textContent = `Bonjour ${customerName},

Votre réservation pour ${roomName} le ${dateStr} à ${startStr} a été annulée.

Des questions ? Appelez-nous au +216 28 720 530 ou répondez à cet e-mail.

— L'équipe elharba`;

    const header = `
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a1a1aa;font-weight:600;">Mise à jour</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">elharba</h1>`;

    const body = `
      <tr>
        <td style="padding:28px 32px 16px;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#fff;font-weight:800;">Réservation annulée</h2>
          <p style="margin:0;color:#888;font-size:14px;">Bonjour ${customerName}, votre réservation a été annulée.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
            ${detailRow("Salle", roomName)}
            ${detailRow("Date", dateStr)}
            ${detailRow("Heure", startStr)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;">
          <p style="margin:0;color:#888;font-size:13px;line-height:1.7;">
            Des questions ? Appelez-nous au <strong style="color:#f0f0f0;">+216 28 720 530</strong> ou répondez à cet e-mail.
          </p>
        </td>
      </tr>`;

    return {
      to: email,
      toName: customerName,
      subject: `Réservation annulée — ${roomName} · ${dateStr}`,
      textContent,
      htmlContent: emailShell("#27272a", header, body, "fr"),
    };
  }

  // English (default)
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
  locale?: Locale;
  gameLanguage?: string;
}): EmailPayload {
  const { customerName, email, phone, roomName, startTime, endTime, partySize, bookingId, locale = "en", gameLanguage = "fr" } = params;
  const total = getTotalPrice(partySize);
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "ahmed.arfaouii11@gmail.com";
  const siteUrl = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");

  const dateStr = fmtDate(startTime, "en");
  const startStr = fmtTime(startTime, "en");
  const endStr = fmtTime(endTime, "en");
  const ref = bookingId.slice(0, 8).toUpperCase();
  const localeLabel = locale === "ar" ? " 🇹🇳 AR" : locale === "fr" ? " 🇫🇷 FR" : "";
  const gameLangLabel = gameLanguage === "en" ? "🇬🇧 English" : "🇫🇷 Français";

  const textContent = `New booking #${ref}

  Room:          ${roomName}
  Date:          ${dateStr}
  Time:          ${startStr} – ${endStr}
  Party:         ${partySize} people
  Revenue:       ${total} TND

  Customer:      ${customerName}
  Email:         ${email}
  Phone:         ${phone}
  Game language: ${gameLangLabel}

Admin: ${siteUrl}/admin/bookings`;

  const header = `
    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#fecdd3;font-weight:600;">Admin Notification</p>
    <h1 style="margin:6px 0 0;font-size:20px;font-weight:900;color:#fff;">🔔 New Booking — #${ref}${localeLabel}</h1>`;

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
            <td style="padding:14px 24px;color:#888;font-size:13px;width:140px;">Revenue</td>
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
          ${detailRow("Game language", gameLangLabel)}
          ${detailRow("UI locale", locale.toUpperCase())}
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

  const ccList = adminEmail !== "ahmed.arfaouii11@gmail.com" ? ["ahmed.arfaouii11@gmail.com"] : [];

  return {
    to: adminEmail,
    toName: "elharba Admin",
    cc: ccList,
    subject: `🔔 New Booking #${ref} — ${roomName} · ${dateStr}`,
    textContent,
    htmlContent: emailShell("#e11d48", header, body),
  };
}
