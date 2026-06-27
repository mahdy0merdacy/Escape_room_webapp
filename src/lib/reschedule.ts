import prisma from "@/lib/prisma";
import { generateUnifiedSlots, type ScheduleConfig } from "@/lib/slots";

export type RescheduledInfo = {
  bookingId: string;
  customerName: string;
  roomName: string;
  originalTime: string;
  newTime: string;
};

export type UnresolvableInfo = {
  bookingId: string;
  customerName: string;
  roomName: string;
  originalTime: string;
};

export type RescheduleResult = {
  rescheduled: RescheduledInfo[];
  unresolvable: UnresolvableInfo[];
};

// Reschedules all future bookings for a given room against a new schedule config.
// Used when per-room or global schedule changes — shared logic to avoid duplication.
export async function rescheduleRoomBookings(
  roomId: string,
  newConfig: ScheduleConfig
): Promise<RescheduleResult> {
  const now = new Date();

  const [futureBookings, futureBlocked] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId, startTime: { gt: now }, status: { in: ["confirmed", "pending"] } },
      include: { room: { select: { id: true, name: true, durationMinutes: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: { roomId, slotStart: { gt: now } },
      select: { roomId: true, slotStart: true },
    }),
  ]);

  const takenKeys = new Set<string>([
    ...futureBookings.map((b) => `${b.roomId}|${b.startTime.getTime()}`),
    ...futureBlocked.map((b) => `${b.roomId}|${new Date(b.slotStart).getTime()}`),
  ]);

  const rescheduled: RescheduledInfo[] = [];
  const unresolvable: UnresolvableInfo[] = [];

  for (const booking of futureBookings) {
    const newSlots = generateUnifiedSlots(booking.startTime, booking.room.durationMinutes, newConfig);
    const originalMs = booking.startTime.getTime();
    const originalKey = `${booking.roomId}|${originalMs}`;

    if (newSlots.some((s) => s.startTime.getTime() === originalMs)) continue;

    takenKeys.delete(originalKey);

    const sorted = [...newSlots].sort(
      (a, b) => Math.abs(a.startTime.getTime() - originalMs) - Math.abs(b.startTime.getTime() - originalMs)
    );
    const target = sorted.find((s) => !takenKeys.has(`${booking.roomId}|${s.startTime.getTime()}`));

    if (!target) {
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
      takenKeys.add(originalKey);
      unresolvable.push({
        bookingId: booking.id,
        customerName: booking.customerName,
        roomName: booking.room.name,
        originalTime: booking.startTime.toISOString(),
      });
    }
  }

  return { rescheduled, unresolvable };
}
