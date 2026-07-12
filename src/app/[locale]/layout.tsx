import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fontUI, fontGothic, fontRetro, fontIndustrial } from "@/lib/fonts";
import { IntlProvider } from "@/components/IntlProvider";
import { dicts, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

const GOOGLE_ADS_ID = "AW-18259724274";

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
    icon: "/icon.png",
    apple: LOGO_URL,
  },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// This is a root layout (renders <html>/<body>) — [locale] is the only segment that
// actually receives the `locale` param, which is why lang/dir can't be set correctly
// from the true top-level app/layout.tsx. Admin has its own separate root for the
// same reason (see src/app/admin/layout.tsx) — Next.js's "multiple root layouts" pattern.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!LOCALES.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dir = dicts[locale].dir;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontUI.variable} ${fontGothic.variable} ${fontRetro.variable} ${fontIndustrial.variable} antialiased`}
    >
      <head>
        {/* Google tag (gtag.js) — placed immediately after <head>, exactly as Google's
            snippet instructs, so conversion tracking fires as early/reliably as possible. */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-ui)] overflow-x-hidden">
        <IntlProvider locale={locale}>{children}</IntlProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
