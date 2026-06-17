"use client";

import Link from "next/link";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-widest uppercase text-white">
          Escape<span className="text-red-500">Zone</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
          <Link href="/rooms" className="hover:text-white transition-colors">
            Rooms
          </Link>
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
          <span className="block w-6 h-0.5 bg-current mb-1.5 transition-transform" />
          <span className="block w-6 h-0.5 bg-current mb-1.5" />
          <span className="block w-6 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-black border-t border-white/10 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link href="/rooms" onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
            Rooms
          </Link>
          <Link
            href="/rooms"
            onClick={() => setOpen(false)}
            className="bg-red-600 text-white px-5 py-2 rounded text-center font-semibold"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}
