import { describe, it, expect } from "vitest";
import { generateSlots, filterAvailableSlots } from "@/lib/slots";

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
