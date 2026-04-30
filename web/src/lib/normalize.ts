/** Normalize a user-typed answer for comparison (Phase 2 input modes). */
export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ');
}
