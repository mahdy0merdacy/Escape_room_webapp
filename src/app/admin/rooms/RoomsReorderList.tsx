"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Room = {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  themeColors: string;
  active: boolean;
  roomStatus: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-900/30 text-green-400 border-green-500/30",
  coming_soon: "bg-amber-900/30 text-amber-400 border-amber-500/30",
  unavailable: "bg-red-900/30 text-red-400 border-red-500/30",
  hidden: "bg-zinc-800/60 text-white/30 border-white/10",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  coming_soon: "Coming Soon",
  unavailable: "Unavailable",
  hidden: "Hidden",
};

function SortableRoom({ room }: { room: Room }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: room.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const colors = JSON.parse(room.themeColors) as { primary: string; accent: string };
  const status = !room.active ? "hidden" : (room.roomStatus ?? "active");
  const statusCls = STATUS_STYLES[status] ?? "bg-white/10 text-white/40 border-white/10";
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: colors.primary }}
      className="rounded-xl border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4 select-none"
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="text-white/20 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h2 className="text-lg font-bold text-white">{room.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded border ${statusCls}`}>{statusLabel}</span>
        </div>
        <p className="text-white/50 text-sm">{room.tagline}</p>
        <p className="text-white/30 text-xs mt-1">
          /{room.slug} · {room.durationMinutes} min · {room.minPlayers}–{room.maxPlayers} players
        </p>
      </div>

      <Link
        href={`/admin/rooms/${room.id}`}
        className="px-4 py-2 rounded text-sm font-semibold border border-white/20 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
      >
        Edit Room
      </Link>
    </div>
  );
}

export default function RoomsReorderList({ initialRooms }: { initialRooms: Room[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = rooms.findIndex((r) => r.id === active.id);
      const newIndex = rooms.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(rooms, oldIndex, newIndex);
      setRooms(reordered);

      setSaving(true);
      try {
        await fetch("/api/admin/rooms/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: reordered.map((r) => r.id) }),
        });
        setSavedAt(new Date());
      } finally {
        setSaving(false);
      }
    },
    [rooms]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-white/30 pb-1">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
          <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
        </svg>
        <span>
          Drag to reorder — order reflects the public rooms page
          {saving && " · Saving…"}
          {!saving && savedAt && ` · Saved`}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rooms.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {rooms.map((room) => (
              <SortableRoom key={room.id} room={room} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
