import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail, bookingCancellationEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body as { status?: string };
  if (status !== "cancelled") {
    return NextResponse.json({ error: "Only cancellation is supported" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  sendEmail(
    bookingCancellationEmail({
      customerName: booking.customerName,
      email: booking.email,
      roomName: booking.room.name,
      startTime: booking.startTime,
    })
  ).catch(console.error);

  return NextResponse.json(updated);
}
