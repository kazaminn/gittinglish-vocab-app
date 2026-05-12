export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ');
}
