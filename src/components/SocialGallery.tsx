import prisma from "@/lib/prisma";
import SocialGalleryClient from "./SocialGalleryClient";

type Album = { id: string; label: string; sub: string; accent: string; featured: boolean };

export default async function SocialGallery() {
  const albums = await prisma.galleryAlbum
    .findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, sub: true, accent: true, featured: true },
    })
    .catch(() => [] as Album[]);

  if (albums.length === 0) return null;

  const featuredIndex = albums.findIndex((a) => a.featured);

  return <SocialGalleryClient albums={albums} featuredIndex={featuredIndex} />;
}
