/**
 * Safely parses a pagination query parameter, guarding against NaN, negative
 * values, and values that exceed the allowed maximum.
 *
 * @param value      - Raw query param value (typically `req.query.take`)
 * @param defaultVal - Fallback when the value is absent, NaN, or <= 0
 * @param max        - Upper bound — parsed result is clamped to this value
 */
export function parsePaginationParam(value: unknown, defaultVal: number, max: number): number {
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed <= 0) return defaultVal;
  return Math.min(parsed, max);
}
