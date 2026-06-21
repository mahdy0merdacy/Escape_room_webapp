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

export function slotWindow(
  year: number,
  month: number,
  day: number,
  schedule: ScheduleConfig
): [Date, Date] {
  const { openHour, openMinute, closeHour, closeMinute } = schedule;
  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;
  const windowStart = new Date(year, month - 1, day, openHour, openMinute, 0, 0);
  const closeDayOffset = closeTotal < openTotal ? 1 : 0;
  const windowEnd = new Date(year, month - 1, day + closeDayOffset, closeHour, closeMinute, 0, 0);
  return [windowStart, windowEnd];
}
