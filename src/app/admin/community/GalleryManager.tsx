"use client";

import { useState } from "react";
import type { GalleryAlbumRow } from "./page";

const PRESET_COLORS = [
  { name: "Red", value: "#e11d48" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Amber", value: "#d97706" },
  { name: "Emerald", value: "#059669" },
  { name: "Orange", value: "#ea580c" },
  { name: "Pink", value: "#db2777" },
  { name: "Indigo", value: "#4f46e5" },
];

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.name}
          onClick={() => onChange(c.value)}
          className="w-6 h-6 rounded-full border-2 transition-all"
          style={{
            background: c.value,
            borderColor: value === c.value ? "white" : "transparent",
            boxShadow: value === c.value ? `0 0 0 2px ${c.value}` : "none",
          }}
        />
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono"
        placeholder="#hex"
      />
    </div>
  );
}

function AlbumRow({
  album,
  onUpdate,
  onDelete,
}: {
  album: GalleryAlbumRow;
  onUpdate: (id: string, patch: Partial<GalleryAlbumRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(album.label);
  const [sub, setSub] = useState(album.sub);
  const [accent, setAccent] = useState(album.accent);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setLoading(true);
    await onUpdate(album.id, { label, sub, accent });
    setLoading(false);
    setEditing(false);
  }

  function cancel() {
    setLabel(album.label);
    setSub(album.sub);
    setAccent(album.accent);
    setEditing(false);
  }

  async function toggleFeatured() {
    setLoading(true);
    await onUpdate(album.id, { featured: !album.featured });
    setLoading(false);
  }

  async function toggleActive() {
    setLoading(true);
    await onUpdate(album.id, { active: !album.active });
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    await onDelete(album.id);
    // no setLoading(false) — row unmounts
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        album.active ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01] opacity-50"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
          style={{ background: album.accent }}
        />

        {album.featured && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}

        {editing ? (
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white w-full"
              placeholder="Album name"
            />
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white/60 w-full"
              placeholder="Subtitle"
            />
            <ColorPicker value={accent} onChange={setAccent} />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{album.label}</p>
            {album.sub && <p className="text-white/40 text-xs truncate">{album.sub}</p>}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={loading || !label.trim()}
                className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-3 py-1.5 rounded font-semibold transition-colors"
              >
                {loading ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancel}
                className="text-xs text-white/40 hover:text-white px-2 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                title={album.featured ? "Unmark as featured" : "Mark as featured (large card)"}
                onClick={toggleFeatured}
                disabled={loading}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-40 ${
                  album.featured
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "text-white/30 hover:text-amber-400 hover:bg-amber-400/10"
                }`}
              >
                ★
              </button>

              <button
                title={album.active ? "Hide album" : "Show album"}
                onClick={toggleActive}
                disabled={loading}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-40 ${
                  album.active
                    ? "bg-white/10 text-white/60 hover:bg-white/20"
                    : "bg-white/5 text-white/25 hover:text-white/60"
                }`}
              >
                {album.active ? "Visible" : "Hidden"}
              </button>

              <button
                onClick={() => setEditing(true)}
                disabled={loading}
                className="text-xs text-white/40 hover:text-white px-2.5 py-1 rounded hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                Edit
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-400">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-40"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-white/30 hover:text-white"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                  className="text-xs text-white/20 hover:text-red-400 px-2 py-1 rounded transition-colors disabled:opacity-40"
                >
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddAlbumForm({ onAdd }: { onAdd: (album: GalleryAlbumRow) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [sub, setSub] = useState("");
  const [accent, setAccent] = useState("#e11d48");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!label.trim()) { setError("Name is required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), sub: sub.trim(), accent }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "Failed to create album");
        return;
      }
      const album = await res.json() as GalleryAlbumRow;
      onAdd(album);
      setLabel("");
      setSub("");
      setAccent("#e11d48");
      setOpen(false);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/[0.03] text-white/40 hover:text-white/70 text-sm py-4 transition-all"
      >
        + Add album
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] p-5 space-y-4">
      <p className="text-sm font-semibold text-white">New album</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Name *</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            placeholder="e.g. Birthday escape 🎉"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Subtitle</label>
          <input
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70"
            placeholder="e.g. We escaped in 52 min!"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Accent color</label>
          <ColorPicker value={accent} onChange={setAccent} />
        </div>
        {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={loading || !label.trim()}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
        >
          {loading ? "Adding…" : "Add album"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          className="text-sm text-white/40 hover:text-white px-3 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function GalleryManager({ initialAlbums }: { initialAlbums: GalleryAlbumRow[] }) {
  const [albums, setAlbums] = useState(initialAlbums);

  async function handleUpdate(id: string, patch: Partial<GalleryAlbumRow>) {
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = await res.json() as GalleryAlbumRow;
    setAlbums((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setAlbums((prev) => prev.filter((a) => a.id !== id));
  }

  function handleAdd(album: GalleryAlbumRow) {
    setAlbums((prev) => [...prev, album]);
  }

  return (
    <div className="space-y-3">
      {albums.length === 0 && (
        <p className="text-white/30 text-sm py-6 text-center">No albums yet — add one below.</p>
      )}
      {albums.map((album) => (
        <AlbumRow key={album.id} album={album} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
      <AddAlbumForm onAdd={handleAdd} />
    </div>
  );
}
