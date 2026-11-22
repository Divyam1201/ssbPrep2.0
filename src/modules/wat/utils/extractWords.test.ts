import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractWords } from "./extractWords";

describe("extractWords", () => {
  it("returns empty array for empty or whitespace-only input", () => {
    assert.deepEqual(extractWords(""), []);
    assert.deepEqual(extractWords("   \n\t  "), []);
    assert.deepEqual(extractWords(",,,  \t\n"), []);
  });

  it("handles numbered lists with periods, parentheses, dashes", () => {
    const input = `
      1. Courage
      2. Bravery
      3) Honor
      4- Discipline
      5. Sacrifice
    `;
    assert.deepEqual(extractWords(input), [
      "Courage",
      "Bravery",
      "Honor",
      "Discipline",
      "Sacrifice",
    ]);
  });

  it("handles bulleted lists with various bullet markers", () => {
    const input = `
      • Victory
      - Duty
      * Loyalty
      – Integrity
      — Respect
    `;
    assert.deepEqual(extractWords(input), [
      "Victory",
      "Duty",
      "Loyalty",
      "Integrity",
      "Respect",
    ]);
  });

  it("handles comma-separated and semicolon-separated items", () => {
    const input = "Courage, Bravery, Honor, Discipline, Loyalty";
    assert.deepEqual(extractWords(input), [
      "Courage",
      "Bravery",
      "Honor",
      "Discipline",
      "Loyalty",
    ]);
  });

  it("handles multiple columns separated by tabs or 2+ spaces", () => {
    const input = `
      1. Peace     2. War     3. Love
      4. Hope\t5. Truth\t6. Faith
    `;
    assert.deepEqual(extractWords(input), [
      "Peace",
      "War",
      "Love",
      "Hope",
      "Truth",
      "Faith",
    ]);
  });

  it("deduplicates case-insensitively while preserving original order and casing of first occurrence", () => {
    const input = "Courage, bravery, COURAGE, Bravery, courage, BRAVERY, Valor";
    assert.deepEqual(extractWords(input), ["Courage", "bravery", "Valor"]);
  });

  it("supports hyphenated words and apostrophes", () => {
    const input = "well-being, don't, mother-in-law, O'Connor";
    assert.deepEqual(extractWords(input), [
      "well-being",
      "don't",
      "mother-in-law",
      "O'Connor",
    ]);
  });

  it("filters out non-alphabetic tokens and numbers", () => {
    const input = `
      123
      45.67
      @#$%
      ---
      Courage
      phrase with spaces
      Bravery
    `;
    assert.deepEqual(extractWords(input), ["Courage", "Bravery"]);
  });

  it("does not cap words (returns all extracted words)", () => {
    // Generate 70 distinct alphabetic words
    const items = Array.from({ length: 70 }, (_, i) => `Word${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`);
    const input = items.join("\n");
    const extracted = extractWords(input);
    assert.equal(extracted.length, 70);
    assert.equal(extracted[0], items[0]);
    assert.equal(extracted[69], items[69]);
  });
});
