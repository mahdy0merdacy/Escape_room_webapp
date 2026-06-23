import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUnifiedSlots } from "@/lib/slots";
import { getScheduleConfig, slotWindow } from "@/lib/schedule";
import { parseRoomSchedule } from "@/lib/room-schedule";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [room, globalSchedule] = await Promise.all([
    prisma.room.findUnique({ where: { slug } }),
    getScheduleConfig(),
  ]);
  if (!room || !room.active) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const roomOverride = parseRoomSchedule(room.openHours);
  const schedule = roomOverride ?? globalSchedule;

  const [year, month, day] = date.split("-").map(Number);
  const sessionDate = new Date(year, month - 1, day);
  const allSlots = generateUnifiedSlots(sessionDate, room.durationMinutes, schedule);
  const [windowStart, windowEnd] = slotWindow(year, month, day, schedule);

  const [booked, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId: room.id, status: { in: ["confirmed", "pending"] }, startTime: { gte: windowStart, lte: windowEnd } },
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
