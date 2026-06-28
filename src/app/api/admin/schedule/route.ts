import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DEFAULT_SCHEDULE, generateUnifiedSlots, type ScheduleConfig } from "@/lib/slots";
import { parseRoomSchedule } from "@/lib/room-schedule";

// Creates the ScheduleConfig table if it doesn't exist yet.
// Uses the tagged-template $executeRaw (supported by the Turso driver adapter)
// rather than $executeRawUnsafe (not supported with driver adapters).
async function ensureTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "ScheduleConfig" (
      "id"           TEXT     NOT NULL PRIMARY KEY,
      "openHour"     INTEGER  NOT NULL DEFAULT 11,
      "openMinute"   INTEGER  NOT NULL DEFAULT 0,
      "closeHour"    INTEGER  NOT NULL DEFAULT 1,
      "closeMinute"  INTEGER  NOT NULL DEFAULT 0,
      "breakMinutes" INTEGER  NOT NULL DEFAULT 0,
      "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = await prisma.scheduleConfig.findUnique({ where: { id: "default" } });
    return NextResponse.json(config ?? { id: "default", ...DEFAULT_SCHEDULE });
  } catch {
    // Table likely missing — create it silently and return defaults
    try { await ensureTable(); } catch {}
    return NextResponse.json({ id: "default", ...DEFAULT_SCHEDULE });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
  const body = (await request.json()) as {
    openHour?: number;
    openMinute?: number;
    closeHour?: number;
    closeMinute?: number;
    breakMinutes?: number;
  };

  const openHour = Number(body.openHour);
  const openMinute = Number(body.openMinute);
  const closeHour = Number(body.closeHour);
  const closeMinute = Number(body.closeMinute);
  const breakMinutes = Number(body.breakMinutes);

  if (
    !Number.isInteger(openHour) || openHour < 0 || openHour > 23 ||
    !Number.isInteger(closeHour) || closeHour < 0 || closeHour > 23 ||
    ![0, 30].includes(openMinute) ||
    ![0, 30].includes(closeMinute) ||
    !Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 240
  ) {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  const newConfig: ScheduleConfig = { openHour, openMinute, closeHour, closeMinute, breakMinutes };

  // Self-heal: if the table is missing, create it and retry once
  let config;
  try {
    config = await prisma.scheduleConfig.upsert({
      where: { id: "default" },
      update: newConfig,
      create: { id: "default", ...newConfig },
    });
  } catch {
    await ensureTable();
    config = await prisma.scheduleConfig.upsert({
      where: { id: "default" },
      update: newConfig,
      create: { id: "default", ...newConfig },
    });
  }

  // ── Auto-reschedule future bookings ──────────────────────────────────────
  // Any future booking whose original slot no longer exists in the new schedule
  // is moved to the closest available slot and reset to "pending" so the admin
  // must reconfirm. Bookings for rooms with a custom per-room override are
  // unaffected because they don't follow the global schedule.

  const now = new Date();

  const futureBookings = await prisma.booking.findMany({
    where: { startTime: { gt: now }, status: { in: ["confirmed", "pending"] } },
    select: {
      id: true,
      roomId: true,
      startTime: true,
      endTime: true,
      status: true,
      customerName: true,
      room: { select: { id: true, name: true, durationMinutes: true, openHours: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // BlockedSlot table may not exist yet on older deployments — degrade gracefully
  const futureBlocked = await prisma.blockedSlot.findMany({
    where: { slotStart: { gt: now } },
    select: { roomId: true, slotStart: true },
  }).catch(() => []);

  // Maintain a live set of taken slot keys (roomId|ms) so moves don't collide.
  const takenKeys = new Set<string>([
    ...futureBookings.map((b) => `${b.roomId}|${b.startTime.getTime()}`),
    ...futureBlocked.map((b) => `${b.roomId}|${new Date(b.slotStart).getTime()}`),
  ]);

  type RescheduledInfo = { bookingId: string; customerName: string; roomName: string; originalTime: string; newTime: string };
  type UnresolvableInfo = { bookingId: string; customerName: string; roomName: string; originalTime: string };

  const rescheduled: RescheduledInfo[] = [];
  const unresolvable: UnresolvableInfo[] = [];

  for (const booking of futureBookings) {
    // Room with custom override → not affected by global schedule change
    const override = parseRoomSchedule(booking.room.openHours);
    if (override?.useCustom) continue;

    // Generate the new slot list for this booking's calendar date
    const newSlots = generateUnifiedSlots(
      booking.startTime,
      booking.room.durationMinutes,
      newConfig
    );

    const originalMs = booking.startTime.getTime();
    const originalKey = `${booking.roomId}|${originalMs}`;

    // If the slot still exists in the new schedule, nothing to do
    if (newSlots.some((s) => s.startTime.getTime() === originalMs)) continue;

    // Free this slot from the taken set while we look for a replacement
    takenKeys.delete(originalKey);

    // Pick the closest available slot
    const sorted = [...newSlots].sort(
      (a, b) =>
        Math.abs(a.startTime.getTime() - originalMs) -
        Math.abs(b.startTime.getTime() - originalMs)
    );
    const target = sorted.find(
      (s) => !takenKeys.has(`${booking.roomId}|${s.startTime.getTime()}`)
    );

    if (!target) {
      // No slot available — leave booking where it is and report
      takenKeys.add(originalKey);
      unresolvable.push({
        bookingId: booking.id,
        customerName: booking.customerName,
        roomName: booking.room.name,
        originalTime: booking.startTime.toISOString(),
      });
      continue;
    }

    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { startTime: target.startTime, endTime: target.endTime, status: "pending" },
      });
      takenKeys.add(`${booking.roomId}|${target.startTime.getTime()}`);
      rescheduled.push({
        bookingId: booking.id,
        customerName: booking.customerName,
        roomName: booking.room.name,
        originalTime: booking.startTime.toISOString(),
        newTime: target.startTime.toISOString(),
      });
    } catch {
      // Unique constraint race — treat as unresolvable
      takenKeys.add(originalKey);
      unresolvable.push({
        bookingId: booking.id,
        customerName: booking.customerName,
        roomName: booking.room.name,
        originalTime: booking.startTime.toISOString(),
      });
    }
  }

  return NextResponse.json({ config, rescheduled, unresolvable });
  } catch (err) {
    console.error("Schedule PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
