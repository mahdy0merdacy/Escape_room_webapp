import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import prisma from "@/lib/prisma";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "About Us — Escape Room in Tunis, Tunisia",
    description:
      "Learn about elharba, Tunisia's top-rated escape room. Our story, values, and what makes our immersive experiences unique.",
    alternates: { canonical: localePath(locale as Locale, "/about"), languages: localeAlternates("/about") },
    openGraph: { url: localePath(locale as Locale, "/about") },
  };
}

type AboutValue = { icon: string; title: string; desc: string };
type AboutFeature = { label: string; desc: string };

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

export default async function AboutPage() {
  type SettingsRow = { key: string; value: string };
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: ["about.values", "about.features"] } },
  }).catch((): SettingsRow[] => []);

  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const VALUES: AboutValue[] = map["about.values"]
    ? (JSON.parse(map["about.values"]) as AboutValue[])
    : DEFAULT_VALUES;

  const FEATURES: AboutFeature[] = map["about.features"]
    ? (JSON.parse(map["about.features"]) as AboutFeature[])
    : DEFAULT_FEATURES;

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Hero */}
      <section className="pt-24 pb-20 px-4 text-center border-b border-white/5">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4">
          Our story
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto">
          Tunisia&apos;s Leading Escape Room Experience
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
          Welcome to elharba — built with one goal: to give Tunisia a fun, challenging,
          and deeply immersive experience that brings people together around a shared adventure.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-5 text-white/60 leading-relaxed">
            <p>
              elharba started with a simple question: why should Tunis be any different from
              the cities around the world where escape rooms have become one of the most loved
              social activities?
            </p>
            <p>
              We opened in Manouba and have since welcomed thousands of participants — families
              celebrating milestones, corporate teams strengthening their bonds, and thrill-seekers
              looking for a night they won&apos;t forget.
            </p>
            <p>
              Each of our three rooms was conceived and built from scratch by our in-house designers.
              No off-the-shelf props, no recycled themes — every detail is intentional, every puzzle
              has a story behind it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "3", label: "Rooms" },
              { value: "60", label: "Minutes" },
              { value: "7", label: "Max Players" },
              { value: "3", label: "Languages" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <p className="text-4xl font-black text-red-500 mb-1">{value}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white/[0.03] border-y border-white/5 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold text-center mb-3">
            What we stand for
          </p>
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3"
              >
                <span className="text-3xl">{icon}</span>
                <p className="text-white font-bold text-lg">{title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold text-center mb-3">
          Why choose us
        </p>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need for the perfect session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ label, desc }) => (
            <div
              key={label}
              className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="w-1.5 shrink-0 rounded-full bg-red-600 mt-1 self-stretch" />
              <div>
                <p className="text-white font-semibold mb-1">{label}</p>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms CTA */}
      <section className="bg-white/[0.03] border-t border-white/5 py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to face the challenge?</h2>
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          Three rooms. Three stories. One hour on the clock. Bring your team and see who makes it out.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/rooms"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
          >
            Book a Room
          </Link>
          <Link
            href="/contact"
            className="border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-lg text-lg transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
