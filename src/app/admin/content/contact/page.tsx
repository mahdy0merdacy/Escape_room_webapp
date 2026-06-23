import prisma from "@/lib/prisma";
import ContactSettingsForm from "./ContactSettingsForm";

export const dynamic = "force-dynamic";

const DEFAULTS: Record<string, string> = {
  "contact.phone": "+216 28 720 530",
};

export default async function ContactSettingsPage() {
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  });
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Contact Info</h1>
      <p className="text-white/40 text-sm mb-10">
        The phone number is used for the Call and WhatsApp buttons on the Contact page and FAQ page.
        Format: <span className="text-white/60 font-mono">+216 28 720 530</span>
      </p>
      <ContactSettingsForm initialPhone={settings["contact.phone"]} />
    </div>
  );
}
