import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '../../src/lib/normalize';

describe('normalizeAnswer', () => {
  it('trims whitespace', () => {
    expect(normalizeAnswer('  hello  ')).toBe('hello');
  });

  it('lowercases input', () => {
    expect(normalizeAnswer('Hello World')).toBe('hello world');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeAnswer('workaround.')).toBe('workaround');
    expect(normalizeAnswer('hello;')).toBe('hello');
    expect(normalizeAnswer('test,,')).toBe('test');
    expect(normalizeAnswer('end:')).toBe('end');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeAnswer('hello   world')).toBe('hello world');
  });

  it('handles combined normalizations', () => {
    expect(normalizeAnswer('  Hello   WORLD.  ')).toBe('hello world');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeAnswer('   ')).toBe('');
  });

  it('does not strip mid-word punctuation', () => {
    expect(normalizeAnswer("don't")).toBe("don't");
  });
});
