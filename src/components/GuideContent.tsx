import { parseGuideContent } from "@/lib/guideContent";

export default function GuideContent({ content }: { content: string }) {
  const blocks = parseGuideContent(content);

  return (
    <div className="text-white/70 leading-relaxed space-y-5">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="text-2xl font-bold text-white pt-4">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc list-inside space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
}
