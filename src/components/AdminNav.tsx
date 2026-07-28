"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSignOut from "@/components/AdminSignOut";

interface AdminNavProps {
  email?: string | null;
  role?: string | null;
}

export default function AdminNav({ email, role }: AdminNavProps) {
  const [open, setOpen] = useState(false);
  const isEmployee = role === "employee";

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bookings", label: "Bookings" },
    ...(!isEmployee
      ? [
          { href: "/admin/rooms", label: "Rooms" },
          { href: "/admin/guides", label: "Guides" },
          { href: "/admin/leaderboard", label: "Leaderboard" },
          { href: "/admin/schedule", label: "Schedule" },
          { href: "/admin/community", label: "Community" },
          { href: "/admin/finance", label: "Finance" },
          { href: "/admin/content", label: "Content" },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-4 text-sm text-white/60">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Desktop right side */}
      <div className="hidden md:flex items-center gap-3 text-sm text-white/40">
        <span>{email}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            isEmployee
              ? "border-blue-500/30 text-blue-400 bg-blue-900/20"
              : "border-white/15 text-white/30"
          }`}
        >
          {role}
        </span>
        <AdminSignOut />
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden ml-auto flex flex-col justify-center gap-1.5 p-2"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span
          className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-black border-b border-white/10 z-50 flex flex-col py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-6 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-2 px-6 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{email}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  isEmployee
                    ? "border-blue-500/30 text-blue-400 bg-blue-900/20"
                    : "border-white/15 text-white/30"
                }`}
              >
                {role}
              </span>
            </div>
            <AdminSignOut />
          </div>
        </div>
      )}
    </>
  );
}
