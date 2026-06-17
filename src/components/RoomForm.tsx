"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type ThemeFont = "gothic" | "retro" | "industrial";

interface RoomFormData {
  slug: string;
  name: string;
  tagline: string;
  story: string;
  heroImageUrl: string;
  galleryImageUrls: string[];
  themeColors: { primary: string; secondary: string; accent: string };
  themeFont: ThemeFont;
  difficulty: number;
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  pricePerPerson: number;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
}

interface Props {
  roomId?: string;
  initial?: Partial<RoomFormData>;
}

const FONT_OPTIONS: { value: ThemeFont; label: string }[] = [
  { value: "gothic", label: "Gothic (Cinzel Decorative — horror)" },
  { value: "retro", label: "Retro (Press Start 2P — 80s)" },
  { value: "industrial", label: "Industrial (Oswald — crime drama)" },
];

export default function RoomForm({ roomId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<RoomFormData>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    story: initial?.story ?? "",
    heroImageUrl: initial?.heroImageUrl ?? "",
    galleryImageUrls: initial?.galleryImageUrls ?? ["", "", ""],
    themeColors: initial?.themeColors ?? { primary: "#000000", secondary: "#111111", accent: "#ff0000" },
    themeFont: initial?.themeFont ?? "gothic",
    difficulty: initial?.difficulty ?? 3,
    durationMinutes: initial?.durationMinutes ?? 60,
    minPlayers: initial?.minPlayers ?? 2,
    maxPlayers: initial?.maxPlayers ?? 6,
    pricePerPerson: initial?.pricePerPerson ?? 20,
    active: initial?.active ?? true,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function set<K extends keyof RoomFormData>(key: K, value: RoomFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setGallery(idx: number, value: string) {
    setForm((f) => {
      const g = [...f.galleryImageUrls];
      g[idx] = value;
      return { ...f, galleryImageUrls: g };
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number | "hero") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(typeof idx === "number" ? idx : -1);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      if (idx === "hero") {
        set("heroImageUrl", data.url);
      } else {
        setGallery(idx, data.url);
      }
    }
    setUploadingIdx(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      ...form,
      galleryImageUrls: form.galleryImageUrls.filter(Boolean),
    };
    const url = roomId ? `/api/admin/rooms/${roomId}` : "/api/admin/rooms";
    const method = roomId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong");
      return;
    }
    router.push("/admin/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Basic Info
        </h2>

        <FormField label="Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
            required
          />
        </FormField>

        <FormField label="Slug (URL)" required>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            className={inputCls}
            required
            disabled={!!roomId}
          />
        </FormField>

        <FormField label="Tagline">
          <input type="text" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        </FormField>

        <FormField label="Story">
          <textarea
            value={form.story}
            onChange={(e) => set("story", e.target.value)}
            rows={6}
            className={`${inputCls} resize-y`}
          />
        </FormField>

        <FormField label="Active">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-white/70 text-sm">Show this room on the site</span>
          </label>
        </FormField>
      </section>

      {/* Pricing & capacity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Pricing & Capacity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField label="Duration (min)">
            <input type="number" min={15} max={180} value={form.durationMinutes} onChange={(e) => set("durationMinutes", +e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Min Players">
            <input type="number" min={1} value={form.minPlayers} onChange={(e) => set("minPlayers", +e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Max Players">
            <input type="number" min={1} value={form.maxPlayers} onChange={(e) => set("maxPlayers", +e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Price / Person ($)">
            <input type="number" min={0} step={0.01} value={form.pricePerPerson} onChange={(e) => set("pricePerPerson", +e.target.value)} className={inputCls} />
          </FormField>
        </div>
        <FormField label="Difficulty (1-5)">
          <input type="range" min={1} max={5} value={form.difficulty} onChange={(e) => set("difficulty", +e.target.value)} className="w-40" />
          <span className="ml-3 text-white/60 text-sm">{form.difficulty}/5</span>
        </FormField>
      </section>

      {/* Theming */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Theme
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {(["primary", "secondary", "accent"] as const).map((c) => (
            <FormField key={c} label={`${c.charAt(0).toUpperCase() + c.slice(1)} color`}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.themeColors[c]}
                  onChange={(e) => set("themeColors", { ...form.themeColors, [c]: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={form.themeColors[c]}
                  onChange={(e) => set("themeColors", { ...form.themeColors, [c]: e.target.value })}
                  className={`${inputCls} font-mono text-sm`}
                  maxLength={7}
                />
              </div>
            </FormField>
          ))}
        </div>
        <FormField label="Heading Font">
          <select
            value={form.themeFont}
            onChange={(e) => set("themeFont", e.target.value as ThemeFont)}
            className={inputCls}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Images
        </h2>
        <FormField label="Hero Image URL">
          <input type="text" value={form.heroImageUrl} onChange={(e) => set("heroImageUrl", e.target.value)} className={inputCls} placeholder="/images/my-hero.jpg" />
        </FormField>
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium block">Gallery Images (URLs)</label>
          {form.galleryImageUrls.map((url, i) => (
            <input
              key={i}
              type="text"
              value={url}
              onChange={(e) => setGallery(i, e.target.value)}
              className={inputCls}
              placeholder={`/images/gallery-${i + 1}.jpg`}
            />
          ))}
        </div>
        <p className="text-white/30 text-xs">
          Upload images to <code>public/images/</code> and reference them as <code>/images/filename.jpg</code>
        </p>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "hero")} />
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">SEO</h2>
        <FormField label="SEO Title">
          <input type="text" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="SEO Description">
          <textarea
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </FormField>
      </section>

      {error && (
        <p className="text-red-400 bg-red-900/20 border border-red-500/30 rounded px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded transition-colors"
        >
          {loading ? "Saving…" : roomId ? "Save Changes" : "Create Room"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-white/20 text-white px-6 py-2.5 rounded hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/70 text-xs font-medium block mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50 placeholder-white/30";
