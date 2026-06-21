import prisma from "@/lib/prisma";
import { DEFAULT_SCHEDULE, type ScheduleConfig } from "@/lib/slots";

export type { ScheduleConfig };

export async function getScheduleConfig(): Promise<ScheduleConfig> {
  try {
    const row = await prisma.scheduleConfig.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT_SCHEDULE;
    return { openHour: row.openHour, closeHour: row.closeHour, breakMinutes: row.breakMinutes };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

// Returns a [windowStart, windowEnd] pair for a given session date + schedule,
// suitable for querying bookings/blockedSlots in that date's slot range.
export function slotWindow(
  year: number,
  month: number,
  day: number,
  schedule: ScheduleConfig
): [Date, Date] {
  const { openHour, closeHour } = schedule;
  const windowStart = new Date(year, month - 1, day, openHour, 0, 0, 0);
  const closeDayOffset = closeHour < openHour ? 1 : 0;
  const windowEnd = new Date(year, month - 1, day + closeDayOffset, closeHour, 0, 0, 0);
  return [windowStart, windowEnd];
}
