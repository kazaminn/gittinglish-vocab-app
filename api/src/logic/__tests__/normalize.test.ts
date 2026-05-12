import { describe, expect, it } from 'vitest';
import { normalizeTextAnswer } from '../normalize.js';

describe('normalizeTextAnswer', () => {
  it('trims whitespace', () => {
    expect(normalizeTextAnswer('  hello  ')).toBe('hello');
  });

  it('converts to lowercase', () => {
    expect(normalizeTextAnswer('Hello World')).toBe('hello world');
  });

  it('strips trailing punctuation only', () => {
    expect(normalizeTextAnswer('hello.')).toBe('hello');
    expect(normalizeTextAnswer('hello, world')).toBe('hello, world');
  });

  it('collapses repeated spaces', () => {
    expect(normalizeTextAnswer('hello   world')).toBe('hello world');
  });
});
