"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface GuideFormData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  heroImageUrl: string;
  pillar: boolean;
  active: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
}

interface Props {
  guideId?: string;
  initial?: Partial<GuideFormData>;
}

export default function GuideForm({ guideId, initial }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<GuideFormData>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    heroImageUrl: initial?.heroImageUrl ?? "",
    pillar: initial?.pillar ?? false,
    active: initial?.active ?? true,
    order: initial?.order ?? 0,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof GuideFormData>(key: K, value: GuideFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) set("heroImageUrl", data.url);
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const url = guideId ? `/api/admin/guides/${guideId}` : "/api/admin/guides";
    const method = guideId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong");
      return;
    }
    router.push("/admin/guides");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Basic Info
        </h2>

        <FormField label="Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
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
            disabled={!!guideId}
          />
          <p className="text-white/25 text-xs mt-1">
            Public URL: /guides/{form.slug || "your-slug"}
          </p>
        </FormField>

        <FormField label="Excerpt">
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className={`${inputCls} resize-y`}
            placeholder="One or two sentences shown on the guides listing page."
          />
        </FormField>

        <FormField label="Content">
          <textarea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={16}
            className={`${inputCls} resize-y font-mono text-xs`}
            placeholder={"Plain text. Blank line = new paragraph.\n## Heading = subheading\n- item = bullet list"}
          />
          <p className="text-white/25 text-xs mt-1">
            Blank line = new paragraph. Line starting with &quot;## &quot; = subheading. Lines starting with &quot;- &quot; = bullet list.
          </p>
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Image</h2>
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
            onChange={handleUpload}
          />
          {form.heroImageUrl && (
            <div
              className="mt-3 h-48 rounded-lg bg-cover bg-center border border-white/10"
              style={{ backgroundImage: `url('${form.heroImageUrl}')` }}
            />
          )}
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Visibility
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Sort Order">
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", +e.target.value)}
              className={inputCls}
            />
          </FormField>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white/70 text-xs font-medium">Pillar page</p>
            <p className="text-white/30 text-xs">
              The main flagship guide — shown first and featured on /guides.
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("pillar", !form.pillar)}
            className={`text-xs px-3 py-2 rounded font-medium transition-colors ${
              form.pillar
                ? "bg-red-600 text-white"
                : "bg-white/5 text-white/25 hover:text-white/60"
            }`}
          >
            {form.pillar ? "Pillar" : "Regular"}
          </button>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white/70 text-xs font-medium">Published</p>
            <p className="text-white/30 text-xs">Visible on the public site when on.</p>
          </div>
          <button
            type="button"
            onClick={() => set("active", !form.active)}
            className={`text-xs px-3 py-2 rounded font-medium transition-colors ${
              form.active
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : "bg-white/5 text-white/25 hover:text-white/60"
            }`}
          >
            {form.active ? "Published" : "Draft"}
          </button>
        </div>
      </section>

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
          {loading ? "Saving…" : guideId ? "Save Changes" : "Create Guide"}
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
