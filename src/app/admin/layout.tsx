import { auth } from "@/lib/auth";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { fontUI, fontGothic, fontRetro, fontIndustrial } from "@/lib/fonts";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

// Admin is a separate root layout (renders its own <html>/<body>) — it isn't nested
// under [locale] since the admin UI is English-only and not part of the public,
// SEO-facing locale structure. See src/app/[locale]/layout.tsx for the public root.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fontUI.variable} ${fontGothic.variable} ${fontRetro.variable} ${fontIndustrial.variable} antialiased`}
    >
      <body className="min-h-dvh bg-[#0a0a0a] text-white font-[family-name:var(--font-ui)] flex flex-col">
      {session && (
        <header className="bg-black border-b border-white/10 relative">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" aria-label="Escape Room Elharba home" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png"
                alt="Escape Room Elharba"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <AdminNav email={session.user?.email} role={session.user?.role} />
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
      <Analytics />
      <SpeedInsights />
      </body>
    </html>
  );
}
