import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({ orderBy: [{ pillar: "desc" }, { order: "asc" }] });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Guides</h1>
        <Link
          href="/admin/guides/new"
          className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          + New Guide
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 divide-y divide-white/10 overflow-hidden">
        {guides.length === 0 && (
          <p className="text-white/40 text-sm p-6">No guides yet — create your first one.</p>
        )}
        {guides.map((guide) => (
          <Link
            key={guide.id}
            href={`/admin/guides/${guide.id}`}
            className="flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {guide.pillar && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600 text-white">
                    Pillar
                  </span>
                )}
                <p className="text-white font-semibold truncate">{guide.title}</p>
              </div>
              <p className="text-white/40 text-xs truncate mt-0.5">/guides/{guide.slug}</p>
            </div>
            <span
              className={`shrink-0 text-xs px-2 py-1 rounded-full border font-medium ${
                guide.active
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-900/20"
                  : "border-white/15 text-white/30"
              }`}
            >
              {guide.active ? "Published" : "Draft"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
