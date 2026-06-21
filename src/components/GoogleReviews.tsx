// Server component — fetches from Google Places API if GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set.
// Revalidates every 24 h. Falls back to a "Leave a review" CTA when credentials are missing.

interface GoogleReview {
  rating: number;
  relativePublishTimeDescription: string;
  text?: { text: string; languageCode: string };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri?: string;
  };
}

interface PlacesResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: GoogleReview[];
}

async function fetchPlaceData(): Promise<PlacesResponse | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : "text-sm";
  return (
    <span className={cls} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function Avatar({ name, photoUri }: { name: string; photoUri?: string }) {
  if (photoUri) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUri} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// Compact Google "G" badge
function GoogleBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Google
    </span>
  );
}

export default async function GoogleReviews() {
  const data = await fetchPlaceData();
  const reviews = data?.reviews?.filter((r) => r.text?.text && r.text.text.length > 20) ?? [];
  const rating = data?.rating;
  const count = data?.userRatingCount;

  const GOOGLE_MAPS_URL =
    "https://search.google.com/local/writereview?placeid=" +
    (process.env.GOOGLE_PLACE_ID ?? "");

  const GOOGLE_SEARCH_URL =
    "https://www.google.com/search?q=elharba+escape+room+manouba+tunisia+reviews";

  return (
    <section className="py-24 px-4 bg-[#0d0d0d]">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
            Player Stories
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Players Say
          </h2>

          {rating && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-yellow-400 text-xl font-black">{rating.toFixed(1)}</span>
              <span className="text-yellow-400 text-lg">{"★".repeat(Math.round(rating))}</span>
              <span className="text-white/30 text-sm">{count ? `${count} reviews` : ""} on</span>
              <GoogleBadge />
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {reviews.slice(0, 6).map((review, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-colors"
                >
                  {/* Stars + Google badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 text-base">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                    <GoogleBadge />
                  </div>

                  {/* Review text */}
                  <p className="text-white/70 text-sm leading-relaxed flex-1 line-clamp-4">
                    &ldquo;{review.text!.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <Avatar
                      name={review.authorAttribution.displayName}
                      photoUri={review.authorAttribution.photoUri}
                    />
                    <div>
                      <a
                        href={review.authorAttribution.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white hover:text-red-400 transition-colors"
                      >
                        {review.authorAttribution.displayName}
                      </a>
                      <p className="text-xs text-white/30">{review.relativePublishTimeDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <a
                href={GOOGLE_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                See all reviews on Google
              </a>
            </div>
          </>
        ) : (
          /* No reviews yet / API not configured — show CTA */
          <div className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full opacity-30 pointer-events-none select-none">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="h-3 bg-white/20 rounded w-24" />
                  <div className="space-y-2">
                    <div className="h-2.5 bg-white/15 rounded w-full" />
                    <div className="h-2.5 bg-white/15 rounded w-5/6" />
                    <div className="h-2.5 bg-white/15 rounded w-4/6" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-white/20 rounded w-20" />
                      <div className="h-2 bg-white/10 rounded w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-white/50 text-sm max-w-sm mx-auto">
                Had a great time? Share your experience and help others find the adventure.
              </p>
              <a
                href={process.env.GOOGLE_PLACE_ID ? GOOGLE_MAPS_URL : GOOGLE_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
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
        )}
      </div>
    </section>
  );
}
