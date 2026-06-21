import prisma from "@/lib/prisma";
import { DEFAULT_SCHEDULE } from "@/lib/slots";
import ScheduleForm from "./ScheduleForm";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [configRow, rooms] = await Promise.all([
    prisma.scheduleConfig.findUnique({ where: { id: "default" } }),
    prisma.room.findMany({
      where: { active: true },
      select: { id: true, name: true, durationMinutes: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const config = configRow
    ? { openHour: configRow.openHour, closeHour: configRow.closeHour, breakMinutes: configRow.breakMinutes }
    : DEFAULT_SCHEDULE;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Schedule Settings</h1>
      <p className="text-white/40 text-sm mb-10">
        Applies to all rooms. Individual slots can still be disabled from the Bookings page.
      </p>
      <ScheduleForm initial={config} rooms={rooms} />
    </div>
  );
}
