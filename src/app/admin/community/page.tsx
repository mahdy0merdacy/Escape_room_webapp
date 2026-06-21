import prisma from "@/lib/prisma";
import GalleryManager from "./GalleryManager";

export const dynamic = "force-dynamic";

const SEED_ALBUMS = [
  { label: "The Horror Room", sub: "Can you handle the dark?", accent: "#e11d48", featured: true, order: 0 },
  { label: "Sci-Fi Escape", sub: "Team photo after escaping 👾", accent: "#7c3aed", featured: false, order: 1 },
  { label: "Crime Scene", sub: "We solved it in 47 min!", accent: "#0891b2", featured: false, order: 2 },
  { label: "Group of 6", sub: "Birthday escape 🎉", accent: "#d97706", featured: false, order: 3 },
  { label: "Corporate team", sub: "Company outing — great fun!", accent: "#059669", featured: false, order: 4 },
];

export default async function CommunityAdminPage() {
  let albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  }).catch(() => [] as typeof SEED_ALBUMS);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Community Gallery</h1>
      <p className="text-white/40 text-sm mb-10">
        Manage the albums shown in the "From Our Players" section on the homepage.
        The <span className="text-white/60">featured</span> album appears larger in the grid.
      </p>
      <GalleryManager initialAlbums={albums as GalleryAlbumRow[]} />
    </div>
  );
}

export type GalleryAlbumRow = {
  id: string;
  label: string;
  sub: string;
  accent: string;
  featured: boolean;
  order: number;
  active: boolean;
};
