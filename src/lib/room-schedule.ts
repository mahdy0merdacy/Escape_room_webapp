import type { ScheduleConfig } from "./slots";

export type RoomScheduleOverride = ScheduleConfig & { useCustom: boolean };

export function parseRoomSchedule(openHours: string): RoomScheduleOverride | null {
  try {
    const obj = JSON.parse(openHours);
    if (obj && obj.useCustom === true) {
      return {
        useCustom: true,
        openHour: Number(obj.openHour ?? 11),
        openMinute: Number(obj.openMinute ?? 0),
        closeHour: Number(obj.closeHour ?? 1),
        closeMinute: Number(obj.closeMinute ?? 0),
        breakMinutes: Number(obj.breakMinutes ?? 0),
      };
    }
  } catch {}
  return null;
}
