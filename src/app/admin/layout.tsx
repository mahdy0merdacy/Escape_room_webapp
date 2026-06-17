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
              <Link href="/" className="text-sm font-bold tracking-widest uppercase text-white">
                el<span className="text-red-500">harba</span>
              </Link>
              <nav className="flex gap-4 text-sm text-white/60">
                <Link href="/admin" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/rooms" className="hover:text-white transition-colors">
                  Rooms
                </Link>
                <Link href="/admin/bookings" className="hover:text-white transition-colors">
                  Bookings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span>{session.user?.email}</span>
              <AdminSignOut />
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
