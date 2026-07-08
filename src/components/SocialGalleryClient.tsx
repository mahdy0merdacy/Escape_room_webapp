"use client";

import { useState } from "react";
import { useT } from "./IntlProvider";

type Album = { id: string; label: string; sub: string; accent: string; featured: boolean; imageUrls: string[] };

const SOCIALS = [
  {
    label: "Instagram",
    handle: "@elharbaescaperoom",
    href: "https://www.instagram.com/elharbaescaperoom",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    handle: "@elharbaescaperoom",
    href: "https://www.tiktok.com/@elharbaescaperoom",
    color: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    handle: "elharba Escape Room",
    href: "https://www.facebook.com/elharbaescaperoom",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

function AlbumCard({ album, large }: { album: Album; large: boolean }) {
  const images = album.imageUrls;
  const [idx, setIdx] = useState(0);
  const hasImages = images.length > 0;
  const isCarousel = images.length > 1;

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  }

  return (
    <div
      className={`${large ? "md:col-span-2 md:row-span-2" : ""} relative rounded-2xl overflow-hidden border border-white/10 group`}
    >
      {/* Background — real image or gradient placeholder */}
      {hasImages ? (
        <div
          role="img"
          aria-label={`${album.label} escape room photo, elharba Manouba`}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${images[idx]}')` }}
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${album.accent}33 0%, #00000099 55%, #000000cc 100%)` }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" className="w-16 h-16" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </>
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Carousel prev/next */}
      {isCarousel && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition-colors opacity-70 group-hover:opacity-100"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition-colors opacity-70 group-hover:opacity-100"
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      )}

      {/* Label + dots */}
      <div className="absolute bottom-0 inset-x-0 p-4">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: album.accent }}>
          {album.label}
        </p>
        {album.sub && <p className="text-white/60 text-xs">{album.sub}</p>}
        {isCarousel && (
          <div className="flex gap-1 mt-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/35 hover:bg-white/60"}`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SocialGalleryClient({ albums, featuredIndex }: { albums: Album[]; featuredIndex: number }) {
  const t = useT();

  return (
    <section className="py-24 px-4 bg-[#080808]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
              {t.gallery.eyebrow}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              {t.gallery.heading}
            </h2>
            <p className="text-white/40 mt-3 max-w-md text-sm">{t.gallery.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white/70 hover:text-white rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                <span style={{ color: s.color }}>{s.icon}</span>
                <span>{s.handle}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[200px]">
          {albums.map((album, i) => (
            <AlbumCard key={album.id} album={album} large={i === featuredIndex} />
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-6">
          <div>
            <p className="text-white font-bold text-lg mb-1">{t.gallery.shareCta}</p>
            <p className="text-white/40 text-sm">
              {t.gallery.shareSub}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {SOCIALS.slice(0, 2).map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
              >
                <span style={{ color: s.color }}>{s.icon}</span>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
