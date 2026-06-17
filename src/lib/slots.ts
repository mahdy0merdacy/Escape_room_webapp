export interface DayHours {
  start: string; // "HH:MM"
  end: string;
}

export type OpenHours = Record<string, DayHours>;

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  label: string;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h, m };
}

export function generateSlots(
  date: Date,
  durationMinutes: number,
  openHours: OpenHours
): TimeSlot[] {
  const dayKey = DAY_KEYS[date.getDay()];
  const hours = openHours[dayKey];
  if (!hours) return [];

  const { h: startH, m: startM } = parseHHMM(hours.start);
  const { h: endH, m: endM } = parseHHMM(hours.end);

  const slots: TimeSlot[] = [];
  // Build candidate slot start times
  const cursor = new Date(date);
  cursor.setHours(startH, startM, 0, 0);

  const closeTime = new Date(date);
  closeTime.setHours(endH, endM, 0, 0);

  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > closeTime) break;

    const label = cursor.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    slots.push({
      startTime: new Date(cursor),
      endTime: new Date(slotEnd),
      label,
    });

    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }

  return slots;
}

export function filterAvailableSlots(
  slots: TimeSlot[],
  bookedStartTimes: Date[]
): TimeSlot[] {
  const bookedMs = new Set(bookedStartTimes.map((d) => d.getTime()));
  return slots.filter((s) => !bookedMs.has(s.startTime.getTime()));
}
