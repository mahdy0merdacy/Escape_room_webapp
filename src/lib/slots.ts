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

// Canonical session hours: 11 AM through 1 AM next day (same across all rooms)
// Hours 0 and 1 are on the next calendar day
export const SESSION_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];

export function generateUnifiedSlots(sessionDate: Date, durationMinutes: number): TimeSlot[] {
  const base = new Date(sessionDate);
  base.setHours(0, 0, 0, 0);

  return SESSION_HOURS.map((hour) => {
    const startTime = new Date(base);
    if (hour < 11) {
      startTime.setDate(startTime.getDate() + 1);
    }
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const label = startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { startTime, endTime, label };
  });
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
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > closeTime) break;
    const label = cursor.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    slots.push({ startTime: new Date(cursor), endTime: new Date(slotEnd), label });
    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }
  return slots;
}
