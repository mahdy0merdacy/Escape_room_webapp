import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSlots, filterAvailableSlots, type OpenHours } from "@/lib/slots";

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

  // Interpret date in local time (midnight)
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  const openHours: OpenHours = JSON.parse(room.openHours);
  const allSlots = generateSlots(dateObj, room.durationMinutes, openHours);

  // Find booked slots for this day
  const dayStart = new Date(dateObj);
  const dayEnd = new Date(dateObj);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const booked = await prisma.booking.findMany({
    where: {
      roomId: room.id,
      status: "confirmed",
      startTime: { gte: dayStart, lt: dayEnd },
    },
    select: { startTime: true },
  });

  const available = filterAvailableSlots(
    allSlots,
    booked.map((b) => b.startTime)
  );

  return NextResponse.json({
    slots: available.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      label: s.label,
    })),
  });
}
