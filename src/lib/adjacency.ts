// Hardcoded room adjacency for noise isolation.
// Order field is UI-only — never use it for this logic.
// Stranger Things is physically in the middle: Annabelle | Stranger Things | Breaking Bad
export const ADJACENCY_MAP: Record<string, string[]> = {
  "annabelle":     ["stranger-things"],
  "breaking-bad":  ["stranger-things"],
  "stranger-things": ["annabelle", "breaking-bad"],
};

export function getAdjacentSlugs(slug: string): string[] {
  return ADJACENCY_MAP[slug] ?? [];
}
