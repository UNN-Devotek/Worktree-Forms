/**
 * Minimal i18n shim — satisfies Global AC #2 (Localization).
 * All user-facing strings must be wrapped with t() so they are
 * ready for a real i18n library (next-intl, react-i18next, etc.)
 * to be substituted without further code changes.
 *
 * TODO: Replace this with next-intl or react-i18next when the
 *       translation infrastructure is set up (Epic 1, NFR13).
 */
export function t(_key: string, defaultValue: string): string {
  return defaultValue;
}
