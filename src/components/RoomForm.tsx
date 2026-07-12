"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TIERS } from "@/lib/pricing";
import { parseStory, type StoryI18n } from "@/lib/story";

type ThemeFont = "gothic" | "retro" | "industrial";
type RoomStatus = "active" | "coming_soon" | "unavailable" | "hidden";

interface RoomFormData {
  slug: string;
  name: string;
  tagline: string;
  storyI18n: StoryI18n;
  heroImageUrl: string;
  trailerUrl: string;
  galleryImageUrls: string[];
  themeColors: { primary: string; secondary: string; accent: string; heroPosition?: string };
  themeFont: ThemeFont;
  difficulty: number;
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  roomStatus: RoomStatus;
  showGallery: boolean;
  seoTitle: string;
  seoDescription: string;
}

interface Props {
  roomId?: string;
  initial?: Partial<RoomFormData> & { story?: string };
}

const FONT_OPTIONS: { value: ThemeFont; label: string }[] = [
  { value: "gothic", label: "Gothic (Cinzel Decorative — horror)" },
  { value: "retro", label: "Retro (Press Start 2P — 80s)" },
  { value: "industrial", label: "Industrial (Oswald — crime drama)" },
];

const STATUS_OPTIONS: { value: RoomStatus; label: string; desc: string }[] = [
  { value: "active", label: "Active", desc: "Shown on site, booking enabled" },
  { value: "coming_soon", label: "Coming Soon", desc: "Shown with banner, no booking" },
  { value: "unavailable", label: "Unavailable", desc: "Shown with banner, no booking" },
  { value: "hidden", label: "Hidden", desc: "Not shown on site at all" },
];

const LANG_TABS: { key: keyof StoryI18n; flag: string; label: string }[] = [
  { key: "en", flag: "🇬🇧", label: "English" },
  { key: "fr", flag: "🇫🇷", label: "Français" },
  { key: "ar", flag: "🇸🇦", label: "العربية" },
];

export default function RoomForm({ roomId, initial }: Props) {
  const router = useRouter();

  const initialStory: StoryI18n =
    initial?.storyI18n ??
    (initial?.story ? parseStory(initial.story) : { en: "", fr: "", ar: "" });

  const [form, setForm] = useState<RoomFormData>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    storyI18n: initialStory,
    heroImageUrl: initial?.heroImageUrl ?? "",
    trailerUrl: initial?.trailerUrl ?? "",
    galleryImageUrls: initial?.galleryImageUrls ?? ["", "", ""],
    themeColors: initial?.themeColors ?? { primary: "#000000", secondary: "#111111", accent: "#ff0000" },
    themeFont: initial?.themeFont ?? "gothic",
    difficulty: initial?.difficulty ?? 3,
    durationMinutes: initial?.durationMinutes ?? 60,
    minPlayers: initial?.minPlayers ?? 2,
    maxPlayers: initial?.maxPlayers ?? 6,
    roomStatus: initial?.roomStatus ?? "active",
    showGallery: initial?.showGallery ?? true,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });

  const [storyLang, setStoryLang] = useState<keyof StoryI18n>("en");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

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

  function setStory(lang: keyof StoryI18n, value: string) {
    setForm((f) => ({ ...f, storyI18n: { ...f.storyI18n, [lang]: value } }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number | "hero") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      if (idx === "hero") set("heroImageUrl", data.url);
      else setGallery(idx as number, data.url);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      ...form,
      story: JSON.stringify(form.storyI18n),
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
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            className={inputCls}
          />
        </FormField>

        {/* Multi-language description */}
        <div>
          <label className="text-white/70 text-xs font-medium block mb-2">Description</label>
          <div className="flex gap-1 mb-2">
            {LANG_TABS.map(({ key, flag, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStoryLang(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  storyLang === key
                    ? "bg-red-600 text-white"
                    : "bg-white/5 text-white/50 hover:text-white border border-white/10"
                }`}
              >
                <span>{flag}</span>
                <span>{label}</span>
                {form.storyI18n[key] && (
                  <span className={`w-1.5 h-1.5 rounded-full ${storyLang === key ? "bg-white/60" : "bg-emerald-400"}`} />
                )}
              </button>
            ))}
          </div>
          {LANG_TABS.map(({ key, flag }) => (
            <textarea
              key={key}
              value={form.storyI18n[key]}
              onChange={(e) => setStory(key, e.target.value)}
              rows={6}
              dir={key === "ar" ? "rtl" : "ltr"}
              placeholder={`Description in ${key === "en" ? "English" : key === "fr" ? "French" : "Arabic"} — ${flag}`}
              className={`${inputCls} resize-y ${storyLang === key ? "" : "hidden"}`}
            />
          ))}
          <p className="text-white/25 text-xs mt-1">
            Shown on the room page. Switches automatically with the visitor&apos;s language.
          </p>
        </div>

        <FormField label="Room Status">
          <select
            value={form.roomStatus}
            onChange={(e) => set("roomStatus", e.target.value as RoomStatus)}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.desc}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      {/* Pricing & capacity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Pricing & Capacity
        </h2>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
            Global Pricing Tiers (TND)
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map((t) => (
              <div key={t.label} className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-white/50 text-xs mb-1">{t.label}</p>
                <p className="text-white font-bold text-lg">{t.pricePerPerson} TND</p>
                <p className="text-white/30 text-xs">/ person</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs pt-1">
            Pricing tiers apply to all rooms. Contact the developer to change them.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <FormField label="Duration (min)">
            <input
              type="number"
              min={15}
              max={180}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", +e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Min Players">
            <input
              type="number"
              min={1}
              value={form.minPlayers}
              onChange={(e) => set("minPlayers", +e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Max Players">
            <input
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => set("maxPlayers", +e.target.value)}
              className={inputCls}
            />
          </FormField>
        </div>

        <FormField label="Difficulty (1–5)">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={5}
              value={form.difficulty}
              onChange={(e) => set("difficulty", +e.target.value)}
              className="w-40"
            />
            <span className="text-white/60 text-sm">{form.difficulty}/5</span>
          </div>
        </FormField>
      </section>

      {/* Theming */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Theme</h2>
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
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Images</h2>
        <FormField label="Hero Image">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.heroImageUrl}
              onChange={(e) => set("heroImageUrl", e.target.value)}
              className={inputCls}
              placeholder="https://... or /images/hero.jpg"
            />
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              disabled={uploading}
              className="shrink-0 px-3 py-2 rounded border border-white/20 text-white/60 hover:text-white text-xs transition-colors disabled:opacity-40"
            >
              {uploading ? "…" : "Upload"}
            </button>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e, "hero")}
          />
          {form.heroImageUrl && (
            <div className="mt-3 space-y-2">
              <div
                className="h-48 rounded-lg bg-cover border border-white/10 transition-all"
                style={{
                  backgroundImage: `url('${form.heroImageUrl}')`,
                  backgroundPosition: `center ${form.themeColors.heroPosition ?? "50%"}`,
                }}
              />
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs shrink-0">Top</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Number((form.themeColors.heroPosition ?? "50%").replace("%", "")) || 50}
                  onChange={(e) =>
                    set("themeColors", { ...form.themeColors, heroPosition: `${e.target.value}%` })
                  }
                  className="flex-1 accent-red-500"
                  aria-label="Vertical image focus"
                />
                <span className="text-white/40 text-xs shrink-0">Bottom</span>
              </div>
              <p className="text-white/25 text-xs">
                Drag to choose which part of the image stays visible. Applies across all pages.
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Video Trailer URL">
          <input
            type="text"
            value={form.trailerUrl}
            onChange={(e) => set("trailerUrl", e.target.value)}
            className={inputCls}
            placeholder="https://youtube.com/watch?v=... or a direct .mp4 link"
          />
          <p className="text-white/25 text-xs mt-1">
            Optional. YouTube, Vimeo, or a direct video file link all work. When set, this replaces
            the hero image at the top of this room&apos;s page with the trailer — the hero image is
            still used on the /rooms listing page and for link previews either way.
          </p>
        </FormField>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white/70 text-xs font-medium">Gallery section</p>
            <p className="text-white/30 text-xs">Show or hide the photo gallery on the public room page</p>
          </div>
          <button
            type="button"
            onClick={() => set("showGallery", !form.showGallery)}
            className={`text-xs px-3 py-2 rounded font-medium transition-colors ${
              form.showGallery
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : "bg-white/5 text-white/25 hover:text-white/60"
            }`}
          >
            {form.showGallery ? "Visible" : "Hidden"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium block">Gallery Images (URLs)</label>
          {form.galleryImageUrls.map((url, i) => (
            <input
              key={i}
              type="text"
              value={url}
              onChange={(e) => setGallery(i, e.target.value)}
              className={inputCls}
              placeholder={`Gallery image ${i + 1} URL`}
            />
          ))}
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">SEO</h2>
        <FormField label="SEO Title">
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            className={inputCls}
          />
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

      <div className="flex gap-3 pb-8">
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

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
