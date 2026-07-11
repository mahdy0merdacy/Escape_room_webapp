"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "./IntlProvider";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  const hideBookNow =
    pathname.startsWith("/rooms/") || pathname.startsWith("/booking");

  const NAV_LINKS = [
    { href: "/rooms", label: t.nav.rooms },
    { href: "/guides", label: t.nav.guides },
    { href: "/faq", label: t.nav.faq },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 border-b border-white/10"
        style={{ viewTransitionName: "site-header" }}
      >
        {/* Blur layer is a separate child so the fixed element itself has no backdrop-filter.
            iOS Safari creates a broken touch-event compositing layer when position:fixed and
            backdrop-filter are on the same element — keeping them separate avoids the bug. */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0" aria-label="elharba home">
            <Image
              src="https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png"
              alt="elharba"
              width={160}
              height={36}
              className="h-9 w-auto object-contain"
              style={{ width: "auto" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            <LanguageSwitcher />
            {!hideBookNow && (
              <Link
                href="/rooms"
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded transition-colors font-semibold tracking-wide"
              >
                {t.nav.bookNow}
              </Link>
            )}
          </nav>

          {/* Mobile: language + hamburger */}
          <div className="md:hidden flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <button
              type="button"
              className="p-2 text-white/80 hover:text-white"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span className={`block w-6 h-0.5 bg-current transition-all mb-1.5 ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-current mb-1.5 transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — rendered outside the header so iOS backdrop-filter doesn't swallow touches */}
      {open && (
        <div className="fixed top-16 inset-x-0 z-40 md:hidden bg-black border-b border-white/10 px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="py-3 text-white/70 hover:text-white text-sm font-medium border-b border-white/5 last:border-0 transition-colors"
            >
              {label}
            </Link>
          ))}
          {!hideBookNow && (
            <Link
              href="/rooms"
              onClick={() => setOpen(false)}
              className="mt-3 bg-red-600 text-white px-5 py-3 rounded text-center font-semibold text-sm"
            >
              {t.nav.bookNow}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
