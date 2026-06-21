const REVIEWS = [
  {
    name: "Zeined Boujeh",
    initials: "ZB",
    rating: 5,
    text: "Incredibly well thought out. Absolutely delightful staff. Very challenging though — be sure to bring many brains!",
    color: "#e11d48",
  },
  {
    name: "Yoda rebirth",
    initials: "YR",
    rating: 5,
    badge: "Dubai, UAE",
    text: "An Unforgettable Experience! I came all the way from Dubai, and I can confidently say this was one of the best escape room experiences I've ever had. Everything — from the puzzles to the atmosphere — was incredibly well thought out and immersive. Truly a one-of-a-kind adventure. Wishing the entire team continued success!",
    color: "#7c3aed",
  },
  {
    name: "Ahmed Dridi",
    initials: "AD",
    rating: 5,
    text: "We had an incredible time at elharba! The puzzles were smart, engaging, and well-designed — challenging without being frustrating. The atmosphere was immersive and the staff were super friendly and professional. Highly recommended for anyone looking for a fun group activity. We'll definitely be back!",
    color: "#0891b2",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < n ? "#FBBF24" : "none"}
          stroke={i < n ? "#FBBF24" : "#4b5563"}
          strokeWidth="1.5"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function GoogleReviews() {
  return (
    <section className="py-28 px-4 bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4">
            Player Stories
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            What Our Players Say
          </h2>
          {/* Overall rating */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
            <span className="text-amber-400 font-black text-lg leading-none">5.0</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" fill="#FBBF24" className="w-4 h-4" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white/40 text-sm">· 3 reviews</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-7 flex flex-col gap-5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              {/* Decorative quote */}
              <div
                className="absolute top-5 right-6 text-7xl font-black leading-none select-none pointer-events-none opacity-10"
                style={{ color: r.color }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              {/* Stars */}
              <Stars n={r.rating} />

              {/* Review text */}
              <p className="text-white/75 text-sm leading-relaxed flex-1 relative z-10">
                &ldquo;{r.text}&rdquo;
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.07]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: r.color + "33", border: `1px solid ${r.color}44` }}
                >
                  <span style={{ color: r.color }}>{r.initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                  {r.badge && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-white/40 mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {r.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/30 text-sm mb-5">
            Had a great time? Share your experience and help others find the adventure.
          </p>
          <a
            href="https://www.google.com/search?q=elharba+escape+room+manouba+tunisia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-3.5 rounded-xl transition-colors shadow-xl shadow-white/5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Leave us a review on Google
          </a>
        </div>

      </div>
    </section>
  );
}
