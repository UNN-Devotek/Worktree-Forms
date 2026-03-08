import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import { t } from './i18n';

// ---------------------------------------------------------------------------
// cn — clsx + tailwind-merge
// ---------------------------------------------------------------------------

describe('cn', () => {
  it('[P0] joins two class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('[P0] deduplicates conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge resolves p-2 vs p-4 to the last
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('[P0] ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('[P0] handles conditional object syntax from clsx', () => {
    expect(cn({ hidden: true, flex: false })).toBe('hidden');
  });

  it('[P0] returns empty string when all values are falsy', () => {
    expect(cn(false, undefined, null)).toBe('');
  });

  it('[P1] merges text color conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('[P1] preserves non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('justify-between');
  });

  it('[P1] handles array of class values', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('[P1] merges bg color conflicts', () => {
    expect(cn('bg-white', 'bg-black')).toBe('bg-black');
  });
});

// ---------------------------------------------------------------------------
// t — i18n shim
// ---------------------------------------------------------------------------

describe('t (i18n shim)', () => {
  it('[P0] returns the defaultValue regardless of key', () => {
    expect(t('any.key', 'Hello World')).toBe('Hello World');
  });

  it('[P0] different keys with same default return same value', () => {
    expect(t('key.one', 'Same')).toBe('Same');
    expect(t('key.two', 'Same')).toBe('Same');
  });

  it('[P1] empty string default returns empty string', () => {
    expect(t('empty.key', '')).toBe('');
  });

  it('[P1] key is ignored — does not affect output', () => {
    const result1 = t('foo', 'value');
    const result2 = t('bar', 'value');
    expect(result1).toBe(result2);
  });
});
