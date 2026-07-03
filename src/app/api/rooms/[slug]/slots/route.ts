import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUnifiedSlots } from "@/lib/slots";
import { getScheduleConfig, slotWindow } from "@/lib/schedule";
import { parseRoomSchedule } from "@/lib/room-schedule";
import { getAdjacentSlugs } from "@/lib/adjacency";

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

  const adjacentSlugs = getAdjacentSlugs(slug);

  const [booked, blocked, adjacencySetting, adjacentBooked] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId: room.id, status: { in: ["confirmed", "pending"] }, startTime: { gte: windowStart, lte: windowEnd } },
      select: { startTime: true },
    }),
    prisma.blockedSlot.findMany({
      where: { roomId: room.id, slotStart: { gte: windowStart, lte: windowEnd } },
      select: { slotStart: true },
    }),
    prisma.siteSettings.findUnique({ where: { key: "adjacencyBlocking" } }),
    adjacentSlugs.length > 0
      ? prisma.booking.findMany({
          where: {
            room: { slug: { in: adjacentSlugs } },
            status: { in: ["confirmed", "pending"] },
            startTime: { gte: windowStart, lte: windowEnd },
          },
          select: { startTime: true },
        })
      : Promise.resolve([]),
  ]);

  const bookedMs = new Set(booked.map((b) => b.startTime.getTime()));
  const blockedMs = new Set(blocked.map((b) => b.slotStart.getTime()));

  if (adjacencySetting?.value === "true") {
    for (const b of adjacentBooked) bookedMs.add(b.startTime.getTime());
  }

  return NextResponse.json({
    slots: allSlots.map((s) => {
      const t = s.startTime.getTime();
      const status = bookedMs.has(t) || blockedMs.has(t) ? "taken" : "available";
      return {
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        label: s.label,
        status,
      };
    }),
  });
}
