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

// Africa/Tunis is UTC+1 with no DST year-round.
// All slot timestamps are computed as UTC values that correspond to the correct
// local time in Tunis, so server timezone and browser timezone are irrelevant.
const TUNIS_TZ = "Africa/Tunis";
const TUNIS_OFFSET_MS = 60 * 60 * 1000; // UTC+1

export function generateUnifiedSlots(
  sessionDate: Date,
  durationMinutes: number,
  schedule: ScheduleConfig = DEFAULT_SCHEDULE
): TimeSlot[] {
  const { openHour, openMinute, closeHour, closeMinute, breakMinutes } = schedule;
  const intervalMs = (durationMinutes + breakMinutes) * 60_000;

  // Resolve the Tunis-local calendar date from sessionDate regardless of what
  // timezone the caller used to construct it (server UTC or browser local).
  const localDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TUNIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(sessionDate); // "YYYY-MM-DD"
  const [y, mo, d] = localDateStr.split("-").map(Number);

  // "midnight Tunis" expressed as a UTC timestamp
  const midnightUtcMs = Date.UTC(y, mo - 1, d) - TUNIS_OFFSET_MS;

  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;
  // Schedule may cross midnight (e.g. open 11pm, close 1am next day)
  const closeDayExtraMin = closeTotal < openTotal ? 24 * 60 : 0;

  const openMs = midnightUtcMs + openTotal * 60_000;
  const closeMs = midnightUtcMs + (closeTotal + closeDayExtraMin) * 60_000;

  const slots: TimeSlot[] = [];
  let cursorMs = openMs;

  while (cursorMs <= closeMs) {
    const startTime = new Date(cursorMs);
    const endTime = new Date(cursorMs + durationMinutes * 60_000);
    const label = startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: TUNIS_TZ,
    });
    slots.push({ startTime, endTime, label });
    cursorMs += intervalMs;
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
