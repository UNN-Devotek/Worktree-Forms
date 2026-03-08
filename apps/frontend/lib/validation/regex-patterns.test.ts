import { describe, it, expect } from 'vitest';
import {
  REGEX_PATTERNS,
  getPatternByName,
  isValidRegex,
  safeRegexTest,
} from './regex-patterns';

describe('REGEX_PATTERNS catalogue', () => {
  it('[P0] contains at least 10 patterns', () => {
    expect(REGEX_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });

  it('[P0] every pattern has name, pattern, description, and example fields', () => {
    for (const p of REGEX_PATTERNS) {
      expect(p.name).toBeTruthy();
      expect(p.pattern).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.example).toBeTruthy();
    }
  });

  it('[P1] every bundled pattern string is a valid regex', () => {
    for (const p of REGEX_PATTERNS) {
      expect(() => new RegExp(p.pattern)).not.toThrow();
    }
  });
});

describe('getPatternByName', () => {
  it('[P0] returns the matching pattern for a known name', () => {
    const p = getPatternByName('Email');
    expect(p).toBeDefined();
    expect(p?.name).toBe('Email');
  });

  it('[P0] returns undefined for an unknown name', () => {
    expect(getPatternByName('NonExistent')).toBeUndefined();
  });

  it('[P1] is case-sensitive', () => {
    expect(getPatternByName('email')).toBeUndefined();
    expect(getPatternByName('EMAIL')).toBeUndefined();
  });
});

describe('isValidRegex', () => {
  it('[P0] returns true for valid patterns', () => {
    expect(isValidRegex('^[a-z]+$')).toBe(true);
    expect(isValidRegex('\\d+')).toBe(true);
    expect(isValidRegex('')).toBe(true); // empty is valid
  });

  it('[P0] returns false for invalid patterns', () => {
    expect(isValidRegex('[unclosed')).toBe(false);
    expect(isValidRegex('(?P<bad>')).toBe(false);
    expect(isValidRegex('*invalid')).toBe(false);
  });
});

describe('safeRegexTest', () => {
  // --- Valid pattern + matching value ---
  it('[P0] matches email pattern against a valid email', () => {
    const emailPattern = getPatternByName('Email')!.pattern;
    const result = safeRegexTest(emailPattern, 'user@example.com');
    expect(result.success).toBe(true);
    expect(result.matched).toBe(true);
  });

  it('[P0] does not match email pattern against an invalid email', () => {
    const emailPattern = getPatternByName('Email')!.pattern;
    const result = safeRegexTest(emailPattern, 'not-an-email');
    expect(result.success).toBe(true);
    expect(result.matched).toBe(false);
  });

  it('[P0] matches US phone pattern against formatted number', () => {
    const phone = getPatternByName('Phone (US)')!.pattern;
    expect(safeRegexTest(phone, '(555) 123-4567').matched).toBe(true);
    expect(safeRegexTest(phone, '555-123-4567').matched).toBe(true);
    expect(safeRegexTest(phone, '5551234567').matched).toBe(true);
    expect(safeRegexTest(phone, 'not-a-phone').matched).toBe(false);
  });

  it('[P0] matches ZIP code pattern', () => {
    const zip = getPatternByName('ZIP Code (US)')!.pattern;
    expect(safeRegexTest(zip, '12345').matched).toBe(true);
    expect(safeRegexTest(zip, '12345-6789').matched).toBe(true);
    expect(safeRegexTest(zip, '1234').matched).toBe(false);
  });

  it('[P0] matches hex color pattern', () => {
    const hex = getPatternByName('Hex Color')!.pattern;
    expect(safeRegexTest(hex, '#FF5733').matched).toBe(true);
    expect(safeRegexTest(hex, '#F57').matched).toBe(true);
    expect(safeRegexTest(hex, 'FF5733').matched).toBe(true); // without #
    expect(safeRegexTest(hex, '#GGGGGG').matched).toBe(false);
  });

  it('[P0] matches IPv4 pattern', () => {
    const ipv4 = getPatternByName('IPv4 Address')!.pattern;
    expect(safeRegexTest(ipv4, '192.168.1.1').matched).toBe(true);
    expect(safeRegexTest(ipv4, '256.0.0.1').matched).toBe(false);
    expect(safeRegexTest(ipv4, '0.0.0.0').matched).toBe(true);
  });

  // --- Invalid pattern ---
  it('[P0] returns success:false and error for invalid regex', () => {
    const result = safeRegexTest('[unclosed', 'test');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.matched).toBeUndefined();
  });

  // --- ReDoS protection ---
  it('[P1] truncates oversized input (>1000 chars) rather than running full match', () => {
    // Uses a valid pattern — just verifying no timeout / crash on huge input
    const result = safeRegexTest('^[a-z]+$', 'a'.repeat(5000));
    expect(result.success).toBe(true);
    // 'a'.repeat(1000) would match ^[a-z]+$
    expect(result.matched).toBe(true);
  });

  it('[P1] strong password pattern rejects weak passwords', () => {
    const strong = getPatternByName('Password (Strong)')!.pattern;
    expect(safeRegexTest(strong, 'Password123!').matched).toBe(true);
    expect(safeRegexTest(strong, 'weakpass').matched).toBe(false);
    expect(safeRegexTest(strong, 'NoSpecial123').matched).toBe(false);
    expect(safeRegexTest(strong, 'short1A!').matched).toBe(true);
  });

  it('[P1] username pattern enforces 3-16 char alphanumeric+underscore', () => {
    const username = getPatternByName('Username')!.pattern;
    expect(safeRegexTest(username, 'abc').matched).toBe(true);
    expect(safeRegexTest(username, 'user_name123').matched).toBe(true);
    expect(safeRegexTest(username, 'ab').matched).toBe(false); // too short
    expect(safeRegexTest(username, 'user-name').matched).toBe(false); // hyphen
    expect(safeRegexTest(username, 'a'.repeat(17)).matched).toBe(false); // too long
  });
});
