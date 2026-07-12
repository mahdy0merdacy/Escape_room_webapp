/**
 * Detects a unique-constraint violation regardless of whether it survives as a
 * clean PrismaClientKnownRequestError (.code === "P2002") — the libSQL/Turso
 * driver adapter used in production doesn't always preserve that shape, so we
 * also fall back to matching the raw SQLite error message.
 */
export function isUniqueConstraintError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "P2002") return true;
  const message = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed/i.test(message);
}
