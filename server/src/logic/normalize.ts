/** Free-text normalization for input-style answers. */
export function normalizeTextAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ');
}
