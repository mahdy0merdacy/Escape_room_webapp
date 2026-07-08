export type GuideBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function parseGuideContent(raw: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  let paragraphBuf: string[] = [];
  let listBuf: string[] = [];

  function flushParagraph() {
    if (paragraphBuf.length) {
      blocks.push({ type: "paragraph", text: paragraphBuf.join(" ").trim() });
      paragraphBuf = [];
    }
  }
  function flushList() {
    if (listBuf.length) {
      blocks.push({ type: "list", items: listBuf });
      listBuf = [];
    }
  }

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      listBuf.push(line.slice(2).trim());
    } else {
      flushList();
      paragraphBuf.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function guideTeaser(raw: string): string {
  const firstParagraph = parseGuideContent(raw).find((b) => b.type === "paragraph");
  return firstParagraph && firstParagraph.type === "paragraph" ? firstParagraph.text : "";
}
