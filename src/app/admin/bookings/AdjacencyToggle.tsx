"use client";

import { useState } from "react";

export default function AdjacencyToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !enabled;
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "adjacencyBlocking", value: next ? "true" : "false" }),
      });
      setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title="When ON, booking Stranger Things blocks Annabelle & Breaking Bad at the same slot, and vice-versa"
      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
        enabled
          ? "bg-amber-900/25 border-amber-500/40 text-amber-400 hover:bg-amber-900/35"
          : "bg-white/5 border-white/15 text-white/40 hover:text-white/60 hover:border-white/25"
      }`}
    >
      {/* Toggle track */}
      <span
        className={`relative inline-flex w-8 h-4 rounded-full transition-colors shrink-0 ${
          enabled ? "bg-amber-500" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      🔇 Sync
    </button>
  );
}
