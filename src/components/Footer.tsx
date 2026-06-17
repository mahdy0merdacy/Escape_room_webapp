import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/50">
        <p>© {new Date().getFullYear()} elharba. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link href="/rooms" className="hover:text-white/80 transition-colors">
            Rooms
          </Link>
        </nav>
        <p className="text-xs text-white/30 text-center md:text-right">
          Themed rooms depicted for entertainment purposes. Franchise names used locally only.
        </p>
      </div>
    </footer>
  );
}
