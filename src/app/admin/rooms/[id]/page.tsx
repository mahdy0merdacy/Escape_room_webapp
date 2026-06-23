import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import RoomForm from "@/components/RoomForm";
import { parseStory } from "@/lib/story";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRoomPage({ params }: Props) {
  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) notFound();

  const colors = JSON.parse(room.themeColors) as {
    primary: string;
    secondary: string;
    accent: string;
  };
  const gallery: string[] = JSON.parse(room.galleryImageUrls);

  // Derive combined status: hidden if inactive, otherwise use roomStatus field
  const roomStatus = !room.active
    ? ("hidden" as const)
    : ((room.roomStatus ?? "active") as "active" | "coming_soon" | "unavailable");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Edit Room</h1>
      <p className="text-white/50 text-sm mb-8">{room.name}</p>
      <RoomForm
        roomId={room.id}
        initial={{
          slug: room.slug,
          name: room.name,
          tagline: room.tagline,
          storyI18n: parseStory(room.story),
          heroImageUrl: room.heroImageUrl,
          galleryImageUrls: [...gallery, "", ""].slice(0, 3),
          themeColors: colors,
          themeFont: room.themeFont as "gothic" | "retro" | "industrial",
          difficulty: room.difficulty,
          durationMinutes: room.durationMinutes,
          minPlayers: room.minPlayers,
          maxPlayers: room.maxPlayers,
          roomStatus,
          seoTitle: room.seoTitle,
          seoDescription: room.seoDescription,
        }}
      />
    </div>
  );
}
