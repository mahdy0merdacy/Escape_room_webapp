import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUnifiedSlots } from "@/lib/slots";
import { getScheduleConfig, slotWindow } from "@/lib/schedule";

// GET ?roomId=&date=YYYY-MM-DD → all unified slots with status (for reschedule picker)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = request.nextUrl.searchParams.get("roomId");
  const date = request.nextUrl.searchParams.get("date");

  if (!roomId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 });
  }

  const [room, schedule] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    getScheduleConfig(),
  ]);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const [year, month, day] = date.split("-").map(Number);
  const sessionDate = new Date(year, month - 1, day);
  const allSlots = generateUnifiedSlots(sessionDate, room.durationMinutes, schedule);
  const [windowStart, windowEnd] = slotWindow(year, month, day, schedule);

  const [booked, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId, status: "confirmed", startTime: { gte: windowStart, lte: windowEnd } },
      select: { startTime: true },
    }),
    prisma.blockedSlot.findMany({
      where: { roomId, slotStart: { gte: windowStart, lte: windowEnd } },
      select: { slotStart: true },
    }),
  ]);

  const bookedMs = new Set(booked.map((b) => b.startTime.getTime()));
  const blockedMs = new Set(blocked.map((b) => b.slotStart.getTime()));

  return NextResponse.json({
    slots: allSlots.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      label: s.label,
      status: bookedMs.has(s.startTime.getTime())
        ? "booked"
        : blockedMs.has(s.startTime.getTime())
        ? "blocked"
        : "available",
    })),
  });
}

// POST body: { roomId, slotStart } → disable a slot
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, slotStart } = (await request.json()) as { roomId: string; slotStart: string };
  if (!roomId || !slotStart) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  try {
    const created = await prisma.blockedSlot.create({
      data: { id: crypto.randomUUID(), roomId, slotStart: new Date(slotStart) },
    });
    return NextResponse.json({ slotStart: created.slotStart.toISOString() });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Already blocked" }, { status: 409 });
    }
    throw err;
  }
}

// DELETE body: { roomId, slotStart } → re-enable a slot
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, slotStart } = (await request.json()) as { roomId: string; slotStart: string };
  if (!roomId || !slotStart) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  await prisma.blockedSlot.deleteMany({
    where: { roomId, slotStart: new Date(slotStart) },
  });

  return NextResponse.json({ ok: true });
}
