import { auth } from "@/lib/auth";
import Link from "next/link";
import AdminSignOut from "@/components/AdminSignOut";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col">
      {session && (
        <header className="bg-black border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" aria-label="elharba home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png"
                  alt="elharba"
                  className="h-7 w-auto object-contain"
                />
              </Link>
              <nav className="flex gap-4 text-sm text-white/60">
                <Link href="/admin" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/bookings" className="hover:text-white transition-colors">
                  Bookings
                </Link>
                {session.user.role !== "employee" && (
                  <>
                    <Link href="/admin/rooms" className="hover:text-white transition-colors">
                      Rooms
                    </Link>
                    <Link href="/admin/schedule" className="hover:text-white transition-colors">
                      Schedule
                    </Link>
                    <Link href="/admin/community" className="hover:text-white transition-colors">
                      Community
                    </Link>
                    <Link href="/admin/finance" className="hover:text-white transition-colors">
                      Finance
                    </Link>
                    <Link href="/admin/content" className="hover:text-white transition-colors">
                      Content
                    </Link>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span>{session.user?.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                session.user.role === "employee"
                  ? "border-blue-500/30 text-blue-400 bg-blue-900/20"
                  : "border-white/15 text-white/30"
              }`}>
                {session.user.role}
              </span>
              <AdminSignOut />
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
