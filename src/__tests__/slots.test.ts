import { describe, it, expect } from "vitest";
import { generateSlots, generateUnifiedSlots, filterAvailableSlots } from "@/lib/slots";

const openHours = {
  mon: { start: "14:00", end: "22:00" },
  tue: { start: "14:00", end: "22:00" },
  wed: { start: "14:00", end: "22:00" },
  thu: { start: "14:00", end: "22:00" },
  fri: { start: "12:00", end: "23:00" },
  sat: { start: "10:00", end: "23:00" },
  sun: { start: "10:00", end: "20:00" },
};

function makeDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("generateSlots", () => {
  it("generates correct slots for a Monday with 60-min duration", () => {
    const monday = makeDate(2025, 1, 6); // 2025-01-06 is Monday
    const slots = generateSlots(monday, 60, openHours);

    // 14:00–22:00 → 8 hourly slots
    expect(slots).toHaveLength(8);
    expect(slots[0].label).toMatch(/2:00/i);
    const last = slots[slots.length - 1];
    expect(last.endTime.getHours()).toBe(22);
  });

  it("generates correct slots for Saturday with 60-min duration", () => {
    const saturday = makeDate(2025, 1, 11); // 2025-01-11 is Saturday
    const slots = generateSlots(saturday, 60, openHours);
    // 10:00–23:00 → 13 slots
    expect(slots).toHaveLength(13);
  });

  it("returns empty array for a day with no hours defined", () => {
    const slots = generateSlots(makeDate(2025, 1, 6), 60, {});
    expect(slots).toHaveLength(0);
  });

  it("respects duration (90-min slots)", () => {
    const monday = makeDate(2025, 1, 6);
    const slots = generateSlots(monday, 90, openHours);
    // 14:00–22:00 = 480min / 90min = 5.33 → 5 slots (last ends 22:30 but closes at 22:00)
    for (const slot of slots) {
      expect(slot.endTime <= new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 22, 0)).toBe(true);
    }
  });

  it("slot startTime and endTime differ by durationMinutes", () => {
    const monday = makeDate(2025, 1, 6);
    const slots = generateSlots(monday, 60, openHours);
    for (const slot of slots) {
      const diffMs = slot.endTime.getTime() - slot.startTime.getTime();
      expect(diffMs).toBe(60 * 60 * 1000);
    }
  });
});

describe("generateUnifiedSlots", () => {
  it("anchors first slot to 11:00 Africa/Tunis = 10:00 UTC", () => {
    // 2026-01-15 00:00 UTC = 01:00 Tunisia → still Jan 15 in Tunisia
    const date = new Date("2026-01-15T00:00:00Z");
    const slots = generateUnifiedSlots(date, 60, {
      openHour: 11, openMinute: 0,
      closeHour: 14, closeMinute: 0,
      breakMinutes: 0,
    });
    expect(slots[0].startTime.toISOString()).toBe("2026-01-15T10:00:00.000Z");
  });

  it("generates the correct number of hourly slots", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const slots = generateUnifiedSlots(date, 60, {
      openHour: 11, openMinute: 0,
      closeHour: 14, closeMinute: 0,
      breakMinutes: 0,
    });
    // 11:00, 12:00, 13:00, 14:00 Tunisia → 4 slots
    expect(slots).toHaveLength(4);
  });

  it("produces correct UTC timestamps for all slots", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const slots = generateUnifiedSlots(date, 60, {
      openHour: 14, openMinute: 0,
      closeHour: 16, closeMinute: 0,
      breakMinutes: 0,
    });
    // 14:00, 15:00, 16:00 Tunisia = 13:00, 14:00, 15:00 UTC
    expect(slots.map((s) => s.startTime.toISOString())).toEqual([
      "2026-01-15T13:00:00.000Z",
      "2026-01-15T14:00:00.000Z",
      "2026-01-15T15:00:00.000Z",
    ]);
  });

  it("applies break between sessions", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const slots = generateUnifiedSlots(date, 60, {
      openHour: 11, openMinute: 0,
      closeHour: 15, closeMinute: 0,
      breakMinutes: 30,
    });
    // 11:00 → 12:30 → 14:00 (next start 15:30 > 15:00) → 3 slots
    expect(slots).toHaveLength(3);
    const gapMs = slots[1].startTime.getTime() - slots[0].startTime.getTime();
    expect(gapMs).toBe(90 * 60 * 1000); // 60 session + 30 break
  });

  it("handles overnight schedule (close before open)", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const slots = generateUnifiedSlots(date, 60, {
      openHour: 22, openMinute: 0,
      closeHour: 1, closeMinute: 0,
      breakMinutes: 0,
    });
    // 22:00, 23:00, 00:00, 01:00 Tunisia = 4 slots
    expect(slots).toHaveLength(4);
    // First slot: 22:00 Tunisia = 21:00 UTC
    expect(slots[0].startTime.toISOString()).toBe("2026-01-15T21:00:00.000Z");
  });

  it("produces identical slots for two UTC timestamps on the same Tunisia calendar day", () => {
    // 00:00 UTC = 01:00 Tunisia (Jan 15), 22:59 UTC = 23:59 Tunisia (still Jan 15)
    const earlyUTC = new Date("2026-01-15T00:00:00Z");
    const lateUTC  = new Date("2026-01-15T22:59:00Z");
    const schedule = { openHour: 11, openMinute: 0, closeHour: 14, closeMinute: 0, breakMinutes: 0 };
    const slotsA = generateUnifiedSlots(earlyUTC, 60, schedule);
    const slotsB = generateUnifiedSlots(lateUTC, 60, schedule);
    expect(slotsA.map((s) => s.startTime.toISOString())).toEqual(
      slotsB.map((s) => s.startTime.toISOString())
    );
  });
});

describe("filterAvailableSlots", () => {
  const monday = makeDate(2025, 1, 6);

  it("filters out booked slots", () => {
    const slots = generateSlots(monday, 60, openHours);
    const booked = [slots[0].startTime, slots[2].startTime];
    const available = filterAvailableSlots(slots, booked);

    expect(available).toHaveLength(slots.length - 2);
    expect(available.some((s) => s.startTime.getTime() === slots[0].startTime.getTime())).toBe(false);
    expect(available.some((s) => s.startTime.getTime() === slots[2].startTime.getTime())).toBe(false);
  });

  it("returns all slots when nothing is booked", () => {
    const slots = generateSlots(monday, 60, openHours);
    const available = filterAvailableSlots(slots, []);
    expect(available).toHaveLength(slots.length);
  });

  it("returns empty when all slots booked", () => {
    const slots = generateSlots(monday, 60, openHours);
    const booked = slots.map((s) => s.startTime);
    const available = filterAvailableSlots(slots, booked);
    expect(available).toHaveLength(0);
  });
});
