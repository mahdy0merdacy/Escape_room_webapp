"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "What is an escape room?",
    a: "An escape room is a physical adventure game where a group of players are locked in a themed room and must find clues, solve puzzles, and complete objectives to escape — all within 60 minutes. It's a fully immersive team experience.",
  },
  {
    q: "How many people can play?",
    a: "Our rooms accommodate between 2 and 7 players per session. For the best experience, we recommend groups of 4 to 5. Larger private groups can contact us to discuss exclusive bookings.",
  },
  {
    q: "How long does a session last?",
    a: "The game itself runs for 60 minutes. Please arrive 10 minutes early for a briefing from our game master. Total time at the venue — including briefing and debrief — is approximately 80 minutes.",
  },
  {
    q: "Do I need experience to play?",
    a: "Not at all. Our rooms are designed for all levels, from complete beginners to seasoned escape room veterans. Our staff will brief you thoroughly before you start, and you can request hints during the game if you get stuck.",
  },
  {
    q: "Is it suitable for children?",
    a: "We recommend a minimum age of 16 due to the intensity of some rooms, particularly Annabelle which contains strong horror elements. Children under 16 must be accompanied by a parent or guardian. The final call is always with the group.",
  },
  {
    q: "How scary is Annabelle?",
    a: "Annabelle is our most intense horror experience — flickering lights, sound effects, moving props, and a deeply unsettling atmosphere. It is not recommended for people with severe anxiety, heart conditions, or a fear of the dark. Stranger Things and Breaking Bad are themed but not horror-focused.",
  },
  {
    q: "What languages do you offer?",
    a: "We offer the full experience in French, Arabic, and English. Just let us know your preference when booking and our game master will brief and guide you in your chosen language.",
  },
  {
    q: "Where are you located?",
    a: "We're in Manouba, Tunisia — easily accessible from Tunis, La Marsa, Ariana, and Bardo by car or public transport. Free parking is available on site.",
  },
  {
    q: "What are your opening hours?",
    a: "We're open daily. Monday to Thursday 2:00 PM to 11:00 PM, Friday and Saturday 12:00 PM to 1:00 AM, and Sunday 12:00 PM to 11:00 PM. Last booking slots are 60 minutes before closing.",
  },
  {
    q: "How do I book?",
    a: "Browse our rooms, choose your date and time slot, fill in your details, and confirm — it takes less than two minutes. Booking is instant with no payment required upfront. You pay at the door on the day.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Yes. Please contact us at least 24 hours before your session to cancel or reschedule free of charge. You can reach us by phone or WhatsApp at +216 28 720 530.",
  },
  {
    q: "What should I wear?",
    a: "Comfortable clothing and closed-toe shoes are recommended. Avoid large jewellery or accessories that could interfere with the props. You don't need any special equipment — everything you need is in the room.",
  },
  {
    q: "What happens if we don't escape in time?",
    a: "No worries — most groups don't escape on their first try! Our game master will step in after the 60 minutes, reveal the solution, and walk you through what you missed. It's all part of the fun.",
  },
  {
    q: "Can I organise a corporate event or birthday?",
    a: "Absolutely. We host team-building sessions, birthday parties, and private group events. Contact us directly via phone or WhatsApp and we'll put together a custom package for your group.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white/5 hover:bg-white/8 transition-colors"
      >
        <span className="text-white font-semibold text-sm sm:text-base">{q}</span>
        <span
          className={`text-white/40 text-xl shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-6 py-5 bg-black/30 text-white/60 text-sm leading-relaxed border-t border-white/5">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center border-b border-white/5">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4">
          Got questions?
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-white/50 max-w-md mx-auto text-lg">
          Everything you need to know before stepping inside.
        </p>
      </section>

      {/* FAQ list */}
      <section className="max-w-3xl mx-auto px-4 py-20 space-y-3">
        {FAQS.map(({ q, a }) => (
          <FaqItem key={q} q={q} a={a} />
        ))}
      </section>

      {/* Still have questions CTA */}
      <section className="bg-white/[0.03] border-t border-white/5 py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Still have questions?</h2>
        <p className="text-white/50 mb-6">
          Call or message us on WhatsApp — we reply fast.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+21628720530"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Call +216 28 720 530
          </a>
          <Link
            href="/contact"
            className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-lg transition-colors"
          >
            Contact Page
          </Link>
        </div>
      </section>
    </div>
  );
}
