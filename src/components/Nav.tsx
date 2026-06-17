"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-widest uppercase text-white">
          el<span className="text-red-500">harba</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
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
          <Link
            href="/rooms"
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded transition-colors font-semibold tracking-wide"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-white/80 hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-current transition-all mb-1.5 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-current mb-1.5 transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-current transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-black border-t border-white/10 px-4 py-4 flex flex-col gap-1">
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
          <Link
            href="/rooms"
            onClick={() => setOpen(false)}
            className="mt-3 bg-red-600 text-white px-5 py-3 rounded text-center font-semibold text-sm"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}
