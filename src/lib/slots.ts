export interface DayHours {
  start: string;
  end: string;
}

export type OpenHours = Record<string, DayHours>;

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  label: string;
}

export interface ScheduleConfig {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  breakMinutes: number;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  openHour: 11,
  openMinute: 0,
  closeHour: 1,
  closeMinute: 0,
  breakMinutes: 0,
};

export function generateUnifiedSlots(
  sessionDate: Date,
  durationMinutes: number,
  schedule: ScheduleConfig = DEFAULT_SCHEDULE
): TimeSlot[] {
  const { openHour, openMinute, closeHour, closeMinute, breakMinutes } = schedule;
  const intervalMinutes = durationMinutes + breakMinutes;

  const base = new Date(sessionDate);
  base.setHours(0, 0, 0, 0);

  const cursor = new Date(base);
  cursor.setHours(openHour, openMinute, 0, 0);

  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;

  // If close is earlier in the day than open, it wraps to the next calendar day
  const closeDay = new Date(base);
  if (closeTotal < openTotal) closeDay.setDate(closeDay.getDate() + 1);
  closeDay.setHours(closeHour, closeMinute, 0, 0);

  const slots: TimeSlot[] = [];

  while (cursor <= closeDay) {
    const startTime = new Date(cursor);
    const endTime = new Date(cursor.getTime() + durationMinutes * 60_000);
    const label = startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    slots.push({ startTime, endTime, label });
    cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
  }

  return slots;
}

export function filterAvailableSlots(slots: TimeSlot[], bookedStartTimes: Date[]): TimeSlot[] {
  const bookedMs = new Set(bookedStartTimes.map((d) => d.getTime()));
  return slots.filter((s) => !bookedMs.has(s.startTime.getTime()));
}

// Legacy helpers kept for backward compat
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h, m };
}

export function generateSlots(date: Date, durationMinutes: number, openHours: OpenHours): TimeSlot[] {
  const dayKey = DAY_KEYS[date.getDay()];
  const hours = openHours[dayKey];
  if (!hours) return [];
  const { h: startH, m: startM } = parseHHMM(hours.start);
  const { h: endH, m: endM } = parseHHMM(hours.end);
  const slots: TimeSlot[] = [];
  const cursor = new Date(date);
  cursor.setHours(startH, startM, 0, 0);
  const closeTime = new Date(date);
  closeTime.setHours(endH, endM, 0, 0);
  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
    if (slotEnd > closeTime) break;
    const label = cursor.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    slots.push({ startTime: new Date(cursor), endTime: new Date(slotEnd), label });
    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }
  return slots;
}
