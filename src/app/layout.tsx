import type { Metadata } from "next";
import { fontUI, fontGothic, fontRetro, fontIndustrial } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EscapeZone — Escape Rooms",
    template: "%s | EscapeZone",
  },
  description:
    "EscapeZone offers three uniquely themed escape rooms. Book your 60-minute adventure today.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontUI.variable} ${fontGothic.variable} ${fontRetro.variable} ${fontIndustrial.variable} antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
