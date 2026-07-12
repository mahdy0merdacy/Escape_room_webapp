import { getVideoEmbed } from "@/lib/video-embed";

export default function RoomTrailer({ url, roomName }: { url: string; roomName: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  return (
    <div className="relative w-full aspect-video max-h-[70vh] mx-auto bg-black">
      {embed.type === "iframe" ? (
        <iframe
          src={embed.src}
          title={`${roomName} trailer`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={embed.src}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
        >
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
