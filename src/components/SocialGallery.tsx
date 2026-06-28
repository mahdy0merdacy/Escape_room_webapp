import prisma from "@/lib/prisma";
import SocialGalleryClient from "./SocialGalleryClient";

type Album = { id: string; label: string; sub: string; accent: string; featured: boolean; imageUrls: string[] };

export default async function SocialGallery() {
  const rawAlbums = await prisma.galleryAlbum
    .findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, sub: true, accent: true, featured: true, imageUrls: true },
    })
    .catch(() => [] as { id: string; label: string; sub: string; accent: string; featured: boolean; imageUrls: string }[]);

  const albums: Album[] = rawAlbums.map((a) => ({
    ...a,
    imageUrls: JSON.parse(a.imageUrls ?? "[]") as string[],
  }));

  if (albums.length === 0) return null;

  const featuredIndex = albums.findIndex((a) => a.featured);

  return <SocialGalleryClient albums={albums} featuredIndex={featuredIndex} />;
}
