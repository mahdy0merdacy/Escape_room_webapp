import type { Metadata } from "next";
import { fontUI, fontGothic, fontRetro, fontIndustrial } from "@/lib/fonts";
import { IntlProvider } from "@/components/IntlProvider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const LOGO_URL =
  "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png";

export const metadata: Metadata = {
  title: {
    default: "elharba — Escape Rooms",
    template: "%s | elharba",
  },
  description:
    "elharba offers three uniquely themed escape rooms. Book your 60-minute adventure today.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
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
      </head>
      <body className="min-h-dvh flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-ui)] overflow-x-hidden">
        <IntlProvider>{children}</IntlProvider>
        <Analytics />
      </body>
    </html>
  );
}
