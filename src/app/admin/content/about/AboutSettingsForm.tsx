"use client";

import { useState } from "react";
import type { AboutValue, AboutFeature } from "./page";

function ValueCard({
  value,
  index,
  onChange,
  onDelete,
}: {
  value: AboutValue;
  index: number;
  onChange: (v: AboutValue) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value.icon}
          onChange={(e) => onChange({ ...value, icon: e.target.value })}
          className="w-14 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-center text-xl outline-none"
          maxLength={4}
        />
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Title"
          className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-white/20 hover:text-red-400 text-xs transition-colors px-1"
          title="Remove"
        >
          ✕
        </button>
      </div>
      <textarea
        rows={2}
        value={value.desc}
        onChange={(e) => onChange({ ...value, desc: e.target.value })}
        placeholder="Description"
        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white/70 text-sm outline-none focus:border-white/30 resize-none"
      />
    </div>
  );
}

function FeatureCard({
  feature,
  index,
  onChange,
  onDelete,
}: {
  feature: AboutFeature;
  index: number;
  onChange: (v: AboutFeature) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={feature.label}
          onChange={(e) => onChange({ ...feature, label: e.target.value })}
          placeholder="Feature title"
          className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-white/30 font-semibold"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-white/20 hover:text-red-400 text-xs transition-colors px-1"
          title="Remove"
        >
          ✕
        </button>
      </div>
      <textarea
        rows={2}
        value={feature.desc}
        onChange={(e) => onChange({ ...feature, desc: e.target.value })}
        placeholder="Description"
        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white/70 text-sm outline-none focus:border-white/30 resize-none"
      />
    </div>
  );
}

export default function AboutSettingsForm({
  initialValues,
  initialFeatures,
}: {
  initialValues: AboutValue[];
  initialFeatures: AboutFeature[];
}) {
  const [tab, setTab] = useState<"values" | "features">("values");
  const [values, setValues] = useState<AboutValue[]>(initialValues);
  const [features, setFeatures] = useState<AboutFeature[]>(initialFeatures);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "about.values", value: JSON.stringify(values) }),
      }),
      fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "about.features", value: JSON.stringify(features) }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setTab("values")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "values" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}
        >
          Values ({values.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("features")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "features" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}
        >
          Features ({features.length})
        </button>
      </div>

      {tab === "values" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map((v, i) => (
              <ValueCard
                key={i}
                value={v}
                index={i}
                onChange={(updated) => setValues(prev => prev.map((x, j) => j === i ? updated : x))}
                onDelete={() => setValues(prev => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setValues(prev => [...prev, { icon: "✨", title: "", desc: "" }])}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 text-sm transition-colors"
          >
            + Add Value
          </button>
        </div>
      )}

      {tab === "features" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                feature={f}
                index={i}
                onChange={(updated) => setFeatures(prev => prev.map((x, j) => j === i ? updated : x))}
                onDelete={() => setFeatures(prev => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFeatures(prev => [...prev, { label: "", desc: "" }])}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 text-sm transition-colors"
          >
            + Add Feature
          </button>
        </div>
      )}

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
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save About Page"}
      </button>
    </div>
  );
}
