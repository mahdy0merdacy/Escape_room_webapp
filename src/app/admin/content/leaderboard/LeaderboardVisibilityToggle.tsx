"use client";

import { useState } from "react";

export default function LeaderboardVisibilityToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !enabled;
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "leaderboard.enabled", value: next ? "true" : "false" }),
      });
      setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-between gap-6">
      <div>
        <p className="text-white font-semibold mb-1">Show leaderboard on the site</p>
        <p className="text-white/40 text-sm">
          When off, the homepage widget, the &quot;Leaderboard&quot; nav link, and the{" "}
          <span className="font-mono text-white/60">/leaderboard</span> page are all hidden from visitors.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        aria-pressed={enabled}
        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 shrink-0 ${
          enabled
            ? "bg-green-900/25 border-green-500/40 text-green-400 hover:bg-green-900/35"
            : "bg-white/5 border-white/15 text-white/40 hover:text-white/60 hover:border-white/25"
        }`}
      >
        <span
          className={`relative inline-flex w-8 h-4 rounded-full transition-colors shrink-0 ${
            enabled ? "bg-green-500" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
        {enabled ? "Visible" : "Hidden"}
      </button>
    </div>
  );
}
