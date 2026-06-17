import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="text-xl font-bold tracking-widest uppercase text-white mb-3">
              el<span className="text-red-500">harba</span>
            </p>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              The leading escape room experience in Tunisia. Three immersive rooms in Manouba — horror, sci-fi, and crime drama.
            </p>
            <div className="flex gap-4 mt-5">
              <a
                href="https://www.facebook.com/elharbaescaperoom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors text-sm"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/elharbaescaperoom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors text-sm"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">Explore</p>
            <nav className="flex flex-col gap-2.5 text-sm text-white/50">
              <Link href="/rooms" className="hover:text-white transition-colors">Rooms</Link>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">Contact</p>
            <div className="flex flex-col gap-2.5 text-sm text-white/50">
              <a href="tel:+21628720530" className="hover:text-white transition-colors">
                +216 28 720 530
              </a>
              <a
                href="https://wa.me/21628720530"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
              <p>Manouba, Tunisia</p>
              <p>Daily 12:00 PM – 1:00 AM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© {new Date().getFullYear()} elharba. All rights reserved.</p>
          <p>Themed rooms depicted for entertainment purposes. Franchise names used locally only.</p>
        </div>
      </div>
    </footer>
  );
}
