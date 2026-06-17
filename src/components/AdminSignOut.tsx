"use client";
import { signOut } from "next-auth/react";

export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-white/40 hover:text-white transition-colors"
    >
      Sign Out
    </button>
  );
}
