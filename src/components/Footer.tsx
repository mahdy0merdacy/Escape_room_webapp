import { getScheduleConfig } from "@/lib/schedule";
import FooterInner from "./FooterInner";

function fmtHour(hour: number, minute: number) {
  const ampm = hour < 12 ? "AM" : "PM";
  const h = hour % 12 || 12;
  return minute === 0 ? `${h}:00 ${ampm}` : `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export default async function Footer() {
  const schedule = await getScheduleConfig();
  const hours = `Daily ${fmtHour(schedule.openHour, schedule.openMinute)} – ${fmtHour(schedule.closeHour, schedule.closeMinute)}`;

  return <FooterInner hours={hours} />;
}
