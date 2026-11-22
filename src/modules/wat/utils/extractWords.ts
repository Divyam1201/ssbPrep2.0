/**
 * Pure utility function to extract distinct words from raw text.
 *
 * Rules:
 * - Split on newlines, commas, tabs, and 2+ spaces.
 * - Strip leading numbering/bullets ("1.", "1)", "•", "-", "*", etc.).
 * - Keep only single alphabetic tokens (allows hyphens and apostrophes, e.g. "well-being", "don't").
 * - Trim, dedupe case-insensitively, preserve original order.
 * - Does not cap length inside this function.
 */
export function extractWords(text: string): string[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Split on newlines, carriage returns, commas, tabs, or 2+ consecutive spaces
  const rawSegments = text.split(/[\r\n,]+|\t+| {2,}/);

  const seen = new Set<string>();
  const words: string[] = [];

  // Single alphabetic token regex (allowing hyphens and apostrophes inside the token)
  const tokenRegex = /^[A-Za-z]+(?:['’\-][A-Za-z]+)*$/;

  for (const raw of rawSegments) {
    let segment = raw.trim();
    if (!segment) continue;

    // Strip leading quotes/brackets if present before numbering
    segment = segment.replace(/^["'‘“(\[]+/, "").trim();

    // Strip leading numbering or bullets (e.g. "1.", "1)", "•", "-", "*", "1. ", "• ")
    segment = segment
      .replace(/^(?:(?:\d+[.):-]?)|[•*\-–—.)\]>])+\s*/, "")
      .trim();

    if (!segment) continue;

    // Strip remaining enclosing punctuation, quotes, trailing dots/colons/semicolons
    segment = segment.replace(/^["'‘“(\[]+|[)"'’”\].,;:]+$/g, "").trim();

    if (!segment) continue;

    // Check if it's a valid single alphabetic token
    if (tokenRegex.test(segment)) {
      const lower = segment.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        words.push(segment);
      }
    }
  }

  return words;
}
