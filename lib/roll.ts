/**
 * Normalises a university roll / registration number as typed by a student:
 * strips spaces and dashes and upper-cases it. Returns null if it can't be one.
 */
export function normalizeRoll(raw: string): string | null {
  const value = raw.replace(/[\s-]/g, "").toUpperCase();
  return /^[0-9A-Z]{6,16}$/.test(value) ? value : null;
}
