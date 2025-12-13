export interface RegexPattern {
  name: string
  pattern: string
  description: string
  example: string
}

export const REGEX_PATTERNS: RegexPattern[] = [
  {
    name: 'Email',
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    description: 'Valid email address',
    example: 'user@example.com'
  },
  {
    name: 'Phone (US)',
    pattern: '^\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$',
    description: 'US phone number',
    example: '(555) 123-4567'
  },
  {
    name: 'ZIP Code (US)',
    pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
    description: 'US ZIP code',
    example: '12345 or 12345-6789'
  },
  {
    name: 'URL',
    pattern: '^https?:\\/\\/[a-zA-Z0-9][-a-zA-Z0-9]*(?:\\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?:\\/[^\\s]*)?$',
    description: 'Valid URL',
    example: 'https://example.com'
  },
  {
    name: 'Social Security Number',
    pattern: '^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$',
    description: 'US SSN',
    example: '123-45-6789'
  },
  {
    name: 'Credit Card',
    pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$',
    description: 'Credit card number',
    example: '4111111111111111'
  },
  {
    name: 'Date (MM/DD/YYYY)',
    pattern: '^(0[1-9]|1[0-2])\\/(0[1-9]|[12][0-9]|3[01])\\/\\d{4}$',
    description: 'Date in MM/DD/YYYY format',
    example: '12/31/2024'
  },
  {
    name: 'Time (HH:MM)',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
    description: '24-hour time format',
    example: '14:30'
  },
  {
    name: 'Username',
    pattern: '^[a-zA-Z0-9_]{3,16}$',
    description: 'Alphanumeric with underscores, 3-16 chars',
    example: 'user_name123'
  },
  {
    name: 'Password (Strong)',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    description: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special',
    example: 'Password123!'
  },
  {
    name: 'Hex Color',
    pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$',
    description: 'Hex color code',
    example: '#FF5733 or #F57'
  },
  {
    name: 'IPv4 Address',
    pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    description: 'IPv4 address',
    example: '192.168.1.1'
  },
  {
    name: 'Letters Only',
    pattern: '^[a-zA-Z\\s]+$',
    description: 'Letters and spaces only',
    example: 'John Doe'
  },
  {
    name: 'Numbers Only',
    pattern: '^[0-9]+$',
    description: 'Numbers only',
    example: '12345'
  },
  {
    name: 'Alphanumeric',
    pattern: '^[a-zA-Z0-9]+$',
    description: 'Letters and numbers only',
    example: 'abc123'
  }
]

/**
 * Get pattern by name
 */
export function getPatternByName(name: string): RegexPattern | undefined {
  return REGEX_PATTERNS.find(p => p.name === name)
}

/**
 * Maximum input length for regex testing to prevent ReDoS attacks.
 * Most form inputs should be well under this limit.
 */
const MAX_REGEX_TEST_LENGTH = 1000

/**
 * Validate if a regex pattern is valid
 */
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

/**
 * Safely test a regex pattern against a value with ReDoS protection.
 * Limits input length to prevent catastrophic backtracking.
 *
 * @param pattern - The regex pattern string
 * @param value - The value to test
 * @returns Object with success status and optional match result or error
 */
export function safeRegexTest(
  pattern: string,
  value: string
): { success: boolean; matched?: boolean; error?: string } {
  // Validate pattern first
  if (!isValidRegex(pattern)) {
    return { success: false, error: 'Invalid regex pattern' }
  }

  // Truncate input to prevent ReDoS attacks
  const truncatedValue = value.length > MAX_REGEX_TEST_LENGTH
    ? value.slice(0, MAX_REGEX_TEST_LENGTH)
    : value

  try {
    const regex = new RegExp(pattern)
    const matched = regex.test(truncatedValue)
    return { success: true, matched }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Regex test failed'
    }
  }
}
