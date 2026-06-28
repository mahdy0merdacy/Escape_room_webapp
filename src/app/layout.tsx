import type { Metadata } from "next";
import { fontUI, fontGothic, fontRetro, fontIndustrial } from "@/lib/fonts";
import { IntlProvider } from "@/components/IntlProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const LOGO_URL =
  "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png";

const BASE_URL = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "elharba",
  url: BASE_URL,
  logo: LOGO_URL,
  telephone: "+21628720530",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Manouba",
    addressLocality: "Manouba",
    addressCountry: "TN",
  },
  sameAs: [
    "https://www.facebook.com/p/Escape-room-elharba-61571229061181/",
    "https://www.instagram.com/escaperoomelharba/",
    "https://www.tiktok.com/@escape.room.elharba",
  ],
};

export const metadata: Metadata = {
  title: {
    default: "elharba — Escape Rooms",
    template: "%s | elharba",
  },
  description:
    "elharba offers three uniquely themed escape rooms in Manouba, Tunisia. Book your 60-minute adventure today.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: "elharba",
    type: "website",
    locale: "en_US",
    images: [{ url: LOGO_URL, alt: "elharba Escape Rooms" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [LOGO_URL],
  },
  icons: {
    apple: LOGO_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fontUI.variable} ${fontGothic.variable} ${fontRetro.variable} ${fontIndustrial.variable} antialiased`}
    >
      <head>
        {/* Apply stored locale before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=localStorage.getItem('locale');if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}else if(l==='fr'){document.documentElement.lang='fr';}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-ui)] overflow-x-hidden">
        <IntlProvider>{children}</IntlProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
