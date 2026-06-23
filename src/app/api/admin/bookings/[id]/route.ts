import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail, bookingConfirmationEmail, bookingCancellationEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    newStartTime?: string;
    newEndTime?: string;
  };

  const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (body.status === "confirmed") {
    const updated = await prisma.booking.update({ where: { id }, data: { status: "confirmed" } });
    sendEmail(
      bookingConfirmationEmail({
        customerName: booking.customerName,
        email: booking.email,
        roomName: booking.room.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        partySize: booking.partySize,
        pricePerPerson: booking.room.pricePerPerson,
      })
    ).catch(console.error);
    return NextResponse.json({ ...updated, startTime: updated.startTime.toISOString(), endTime: updated.endTime.toISOString(), createdAt: updated.createdAt.toISOString() });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  if (body.status === "cancelled") {
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: "cancelled" } });
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

  // ── Reschedule ────────────────────────────────────────────────────────────
  if (body.newStartTime && body.newEndTime) {
    const newStart = new Date(body.newStartTime);
    const newEnd = new Date(body.newEndTime);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Check slot not already booked by someone else
    const conflict = await prisma.booking.findFirst({
      where: { roomId: booking.roomId, startTime: newStart, status: { in: ["confirmed", "pending"] }, NOT: { id } },
    });
    if (conflict) return NextResponse.json({ error: "Slot already booked" }, { status: 409 });

    // Check slot not blocked
    const blocked = await prisma.blockedSlot.findFirst({
      where: { roomId: booking.roomId, slotStart: newStart },
    });
    if (blocked) return NextResponse.json({ error: "Slot is disabled" }, { status: 409 });

    const updated = await prisma.booking.update({
      where: { id },
      data: { startTime: newStart, endTime: newEnd },
    });
    return NextResponse.json({
      ...updated,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    });
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}
