import prisma from "@/lib/prisma";
import AboutSettingsForm from "./AboutSettingsForm";

export const dynamic = "force-dynamic";

export type AboutValue = { icon: string; title: string; desc: string };
export type AboutFeature = { label: string; desc: string };

const DEFAULT_VALUES: AboutValue[] = [
  { icon: "🤝", title: "Friendliness", desc: "A warm welcome from our team every time. We guide every group through a personalised briefing so you feel ready before the clock starts." },
  { icon: "🎨", title: "Creativity", desc: "Every scenario is an original creation, designed in-house with custom sets, sound design, and lighting built to pull you into the story." },
  { icon: "🌍", title: "Accessibility", desc: "We run sessions in French, Arabic, and English. Our rooms are designed for beginners and seasoned players alike." },
  { icon: "🛡️", title: "Safety", desc: "Your wellbeing comes first. All rooms have an emergency exit, a live game master monitors every session, and you can leave at any time." },
];

const DEFAULT_FEATURES: AboutFeature[] = [
  { label: "Total Immersion", desc: "Original storylines with meticulous sets, sound, and lighting design." },
  { label: "All Levels Welcome", desc: "From first-timers to escape room enthusiasts — no prior experience needed." },
  { label: "Extended Hours", desc: "Open daily from 12:00 PM to 1:00 AM so you can come after work or late at night." },
  { label: "Convenient Location", desc: "Manouba, near Tunis. Free parking on site, accessible by public transport." },
  { label: "Multilingual", desc: "Fully playable in French, Arabic, and English." },
  { label: "Instant Confirmation", desc: "Book online, get confirmed immediately, pay at the door." },
];

export default async function AboutSettingsPage() {
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: ["about.values", "about.features"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const values: AboutValue[] = map["about.values"]
    ? (JSON.parse(map["about.values"]) as AboutValue[])
    : DEFAULT_VALUES;

  const features: AboutFeature[] = map["about.features"]
    ? (JSON.parse(map["about.features"]) as AboutFeature[])
    : DEFAULT_FEATURES;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">About Page</h1>
      <p className="text-white/40 text-sm mb-10">
        Edit the values and features cards. Changes appear on the public About page immediately.
      </p>
      <AboutSettingsForm initialValues={values} initialFeatures={features} />
    </div>
  );
}
