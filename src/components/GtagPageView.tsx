"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Manually re-fires a gtag page_view on mount. Needed on pages only ever reached
 * via client-side navigation (Next.js router.push) — the base gtag snippet in the
 * root <head> only runs once on the initial full page load, so client-side route
 * changes are invisible to Google Ads' URL-based conversion matching unless we
 * tell it about the new URL ourselves.
 */
export default function GtagPageView() {
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []);

  return null;
}
