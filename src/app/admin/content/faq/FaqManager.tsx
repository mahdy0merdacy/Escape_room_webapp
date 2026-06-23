"use client";

import { useState } from "react";
import type { FaqItemRow } from "./page";

const LANGS = [
  { key: "en" as const, flag: "🇬🇧", label: "English" },
  { key: "fr" as const, flag: "🇫🇷", label: "Français" },
  { key: "ar" as const, flag: "🇸🇦", label: "العربية" },
];

type Lang = "en" | "fr" | "ar";

function FaqRow({
  item,
  index,
  total,
  onSave,
  onDelete,
  onMove,
}: {
  item: FaqItemRow;
  index: number;
  total: number;
  onSave: (updated: FaqItemRow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, dir: -1 | 1) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const dirty =
    form.q_en !== item.q_en || form.q_fr !== item.q_fr || form.q_ar !== item.q_ar ||
    form.a_en !== item.a_en || form.a_fr !== item.a_fr || form.a_ar !== item.a_ar ||
    form.active !== item.active;

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  }

  const qKey = `q_${lang}` as keyof FaqItemRow;
  const aKey = `a_${lang}` as keyof FaqItemRow;

  return (
    <div className={`rounded-xl border ${form.active ? "border-white/10" : "border-white/5 opacity-60"} bg-white/5 overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMove(item.id, -1)}
            disabled={index === 0}
            className="text-white/30 hover:text-white/70 disabled:opacity-20 text-xs leading-none"
            title="Move up"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(item.id, 1)}
            disabled={index === total - 1}
            className="text-white/30 hover:text-white/70 disabled:opacity-20 text-xs leading-none"
            title="Move down"
          >
            ▼
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 text-left min-w-0"
        >
          <p className="text-white text-sm font-medium truncate">
            {form.q_en || <span className="text-white/30 italic">Untitled question</span>}
          </p>
          {form.q_fr && <p className="text-white/30 text-xs truncate">{form.q_fr}</p>}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${form.active ? "bg-green-600" : "bg-white/20"}`}
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-white/40 text-xs">{form.active ? "Active" : "Hidden"}</span>
          </label>
          <span className="text-white/20 text-lg cursor-pointer select-none" onClick={() => setOpen(!open)}>
            {open ? "▾" : "▸"}
          </span>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLang(l.key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  lang === l.key ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>

          <div dir={lang === "ar" ? "rtl" : "ltr"}>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-1">Question</label>
            <input
              type="text"
              value={form[qKey] as string}
              onChange={(e) => setForm(f => ({ ...f, [qKey]: e.target.value }))}
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-white/30 outline-none"
            />
          </div>

          <div dir={lang === "ar" ? "rtl" : "ltr"}>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-1">Answer</label>
            <textarea
              rows={4}
              value={form[aKey] as string}
              onChange={(e) => setForm(f => ({ ...f, [aKey]: e.target.value }))}
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-white/30 outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {!confirmDel ? (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="text-red-500 hover:text-red-400 text-sm transition-colors"
                >
                  Delete
                </button>
              ) : (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-white/50">Sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(false)}
                    className="text-white/40 hover:text-white/70"
                  >
                    Cancel
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-semibold px-4 py-1.5 rounded transition-colors"
            >
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FaqManager({ initialItems }: { initialItems: FaqItemRow[] }) {
  const [items, setItems] = useState<FaqItemRow[]>(initialItems);
  const [adding, setAdding] = useState(false);

  async function handleSave(updated: FaqItemRow) {
    const res = await fetch(`/api/admin/faq/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const saved = await res.json() as FaqItemRow;
      setItems(prev => prev.map(it => it.id === saved.id ? { ...it, ...saved } : it));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    if (res.ok) setItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleMove(id: string, dir: -1 | 1) {
    const idx = items.findIndex(it => it.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const a = { ...items[idx], order: items[swapIdx].order };
    const b = { ...items[swapIdx], order: items[idx].order };

    await Promise.all([
      fetch(`/api/admin/faq/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) }),
      fetch(`/api/admin/faq/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    ]);

    setItems(prev => {
      const next = [...prev];
      next[idx] = a;
      next[swapIdx] = b;
      return next.sort((x, y) => x.order - y.order);
    });
  }

  async function handleAdd() {
    setAdding(true);
    const res = await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    if (res.ok) {
      const created = await res.json() as FaqItemRow;
      setItems(prev => [...prev, created]);
    }
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <FaqRow
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          onSave={handleSave}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 text-sm transition-colors disabled:opacity-40"
      >
        {adding ? "Adding…" : "+ Add Question"}
      </button>
    </div>
  );
}
