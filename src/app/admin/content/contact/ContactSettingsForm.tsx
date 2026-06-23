"use client";

import { useState } from "react";

function phoneToTel(phone: string) {
  return phone.replace(/\s/g, "");
}
function phoneToWa(phone: string) {
  return phone.replace(/[+\s]/g, "");
}

export default function ContactSettingsForm({ initialPhone }: { initialPhone: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "contact.phone", value: phone }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
            placeholder="+216 28 720 530"
            className="w-full bg-black/30 border border-white/10 rounded px-4 py-3 text-white font-mono text-lg focus:border-white/30 outline-none"
          />
          <p className="text-white/30 text-xs mt-2">
            Include the country code with +. Spaces are OK — they're stripped automatically for links.
          </p>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Preview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-black/20 border border-white/5 p-3">
              <p className="text-white/30 text-xs mb-1">📞 Call link</p>
              <p className="text-white font-mono text-sm">tel:{phoneToTel(phone)}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/5 p-3">
              <p className="text-white/30 text-xs mb-1">💬 WhatsApp link</p>
              <p className="text-white font-mono text-sm">wa.me/{phoneToWa(phone)}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
          saved
            ? "bg-green-700 text-green-100"
            : "bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
        }`}
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Contact Info"}
      </button>
    </div>
  );
}
