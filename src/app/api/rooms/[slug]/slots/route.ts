import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUnifiedSlots } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { slug } });
  if (!room || !room.active) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const sessionDate = new Date(year, month - 1, day);
  const allSlots = generateUnifiedSlots(sessionDate, room.durationMinutes);

  // Query window covers 11 AM session day → 2 AM next day
  const windowStart = new Date(year, month - 1, day, 11, 0, 0, 0);
  const windowEnd = new Date(year, month - 1, day + 1, 2, 0, 0, 0);

  const [booked, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId: room.id, status: "confirmed", startTime: { gte: windowStart, lte: windowEnd } },
      select: { startTime: true },
    }),
    prisma.blockedSlot.findMany({
      where: { roomId: room.id, slotStart: { gte: windowStart, lte: windowEnd } },
      select: { slotStart: true },
    }),
  ]);

  const bookedMs = new Set(booked.map((b) => b.startTime.getTime()));
  const blockedMs = new Set(blocked.map((b) => b.slotStart.getTime()));

  const available = allSlots.filter((s) => {
    const t = s.startTime.getTime();
    return !bookedMs.has(t) && !blockedMs.has(t);
  });

  return NextResponse.json({
    slots: available.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      label: s.label,
    })),
  });
}
