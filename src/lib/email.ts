import prisma from "@/lib/prisma";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { to, subject, body } = payload;

  console.log("\n📧 [EMAIL STUB] ─────────────────────────────");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log("─────────────────────────────────────────────\n");

  await prisma.emailLog.create({ data: { to, subject, body } });
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
  const { customerName, email, roomName, startTime, endTime, partySize, pricePerPerson } = params;
  const total = (partySize * pricePerPerson).toFixed(2);
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startStr = startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const endStr = endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    to: email,
    subject: `Booking Confirmed — ${roomName} on ${dateStr}`,
    body: `Hi ${customerName},

Your escape room booking is confirmed!

Room:       ${roomName}
Date:       ${dateStr}
Time:       ${startStr} – ${endStr}
Party size: ${partySize} people
Total due:  ${total} TND (payable at the venue)

See you there!
— The elharba Team`,
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

  return {
    to: email,
    subject: `Booking Cancelled — ${roomName} on ${dateStr}`,
    body: `Hi ${customerName},

Your booking for ${roomName} on ${dateStr} at ${startStr} has been cancelled.

If you have questions, please contact us.
— The elharba Team`,
  };
}
