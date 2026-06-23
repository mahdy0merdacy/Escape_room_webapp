import type { Metadata } from "next";
import ContactContent from "@/components/ContactContent";
import { getScheduleConfig } from "@/lib/schedule";
import { DEFAULT_SCHEDULE } from "@/lib/slots";
import prisma from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact — elharba Escape Room",
  description:
    "Find elharba escape room in Manouba. Call or WhatsApp us, get directions, and check our opening hours.",
};

function formatTime(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function ContactPage() {
  const [schedule, phoneSetting] = await Promise.all([
    getScheduleConfig().catch(() => DEFAULT_SCHEDULE),
    prisma.siteSettings.findUnique({ where: { key: "contact.phone" } }).catch(() => null),
  ]);
  const openStr = formatTime(schedule.openHour, schedule.openMinute);
  const closeStr = formatTime(schedule.closeHour, schedule.closeMinute);
  const phone = phoneSetting?.value ?? "+216 28 720 530";

  return <ContactContent openStr={openStr} closeStr={closeStr} phone={phone} />;
}
