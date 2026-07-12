/**
 * A room's trailer link can be a YouTube/Vimeo page URL (needs an <iframe> embed)
 * or a direct video file URL, e.g. an .mp4 hosted on Blob storage (needs a native
 * <video> tag). This tells the two apart and normalizes YouTube/Vimeo URLs into
 * their embeddable form.
 */
export function getVideoEmbed(url: string): { type: "iframe" | "file"; src: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.pathname === "/watch" ? parsed.searchParams.get("v") : parsed.pathname.split("/").pop();
      if (id) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
  } catch {
    return null; // not a valid URL at all
  }

  // Anything else (a direct .mp4/.webm/etc link) is treated as a playable file.
  return { type: "file", src: trimmed };
}
