import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RoomsReorderList from "./RoomsReorderList";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const session = await auth();
  if (session?.user?.role === "employee") redirect("/admin");
  const rooms = await prisma.room.findMany({ orderBy: { order: "asc" } });

  const roomData = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    tagline: room.tagline,
    slug: room.slug,
    durationMinutes: room.durationMinutes,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    themeColors: room.themeColors,
    active: room.active,
    roomStatus: room.roomStatus,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Rooms</h1>
        <Link
          href="/admin/rooms/new"
          className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          + New Room
        </Link>
      </div>

      <RoomsReorderList initialRooms={roomData} />
    </div>
  );
}
