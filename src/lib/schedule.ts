import prisma from "@/lib/prisma";
import { DEFAULT_SCHEDULE, type ScheduleConfig } from "@/lib/slots";

export type { ScheduleConfig };

export async function getScheduleConfig(): Promise<ScheduleConfig> {
  try {
    const row = await prisma.scheduleConfig.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT_SCHEDULE;
    return {
      openHour: row.openHour,
      openMinute: row.openMinute,
      closeHour: row.closeHour,
      closeMinute: row.closeMinute,
      breakMinutes: row.breakMinutes,
    };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

const TUNIS_OFFSET_MS = 60 * 60 * 1000; // Africa/Tunis = UTC+1, no DST

export function slotWindow(
  year: number,
  month: number,
  day: number,
  schedule: ScheduleConfig
): [Date, Date] {
  const { openHour, openMinute, closeHour, closeMinute } = schedule;
  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;
  const closeDayExtraMin = closeTotal < openTotal ? 24 * 60 : 0;
  const midnightUtcMs = Date.UTC(year, month - 1, day) - TUNIS_OFFSET_MS;
  const windowStart = new Date(midnightUtcMs + openTotal * 60_000);
  const windowEnd = new Date(midnightUtcMs + (closeTotal + closeDayExtraMin) * 60_000);
  return [windowStart, windowEnd];
}
