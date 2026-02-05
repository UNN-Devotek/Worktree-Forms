/**
 * useThemeColors - Get theme-aware colors for canvas rendering
 *
 * Reads CSS variables from the current theme (light/dark) and provides
 * colors in hex format for canvas rendering.
 */

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export interface ThemeColors {
  background: string;
  foreground: string;
  cellBg: string;
  cellText: string;
  gridLine: string;
  selectedBorder: string;
  headerBg: string;
  headerText: string;
  mutedBg: string;
  mutedText: string;
  border: string;
}

/**
 * Convert CSS color variable to hex
 */
function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') return '#000000';

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  // If already hex, return it
  if (value.startsWith('#')) return value;

  // If oklch format, convert to hex (approximation)
  if (value.startsWith('oklch')) {
    return oklchToHex(value);
  }

  // Fallback
  return value || '#000000';
}

/**
 * Convert oklch to hex (simple approximation)
 */
function oklchToHex(oklch: string): string {
  // Extract lightness from oklch format
  const match = oklch.match(/oklch\(([\d.]+)/);
  if (!match) return '#000000';

  const lightness = parseFloat(match[1]);

  // Simple grayscale approximation
  const gray = Math.round(lightness * 255);
  const hex = gray.toString(16).padStart(2, '0');

  return `#${hex}${hex}${hex}`;
}

/**
 * Convert hsl to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function useThemeColors(): ThemeColors {
  const { theme, resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>({
    background: '#ffffff',
    foreground: '#000000',
    cellBg: '#ffffff',
    cellText: '#000000',
    gridLine: '#e5e7eb',
    selectedBorder: '#3b82f6',
    headerBg: '#f9fafb',
    headerText: '#6b7280',
    mutedBg: '#f3f4f6',
    mutedText: '#6b7280',
    border: '#e5e7eb',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateColors = () => {
      const isDark = resolvedTheme === 'dark' || document.documentElement.classList.contains('dark');

      // Read theme colors from CSS variables
      const background = getCSSVariable('--background');
      const foreground = getCSSVariable('--foreground');
      const border = getCSSVariable('--border');
      const muted = getCSSVariable('--muted');
      const mutedForeground = getCSSVariable('--muted-foreground');
      const primary = getCSSVariable('--primary');

      // Set theme-aware colors
      setColors({
        background: isDark ? '#0a0a0a' : '#ffffff',
        foreground: isDark ? '#fafafa' : '#0a0a0a',
        cellBg: isDark ? '#0a0a0a' : '#ffffff',
        cellText: isDark ? '#fafafa' : '#0a0a0a',
        gridLine: isDark ? '#27272a' : '#e5e7eb',
        selectedBorder: '#3b82f6', // Primary blue (same in both themes)
        headerBg: isDark ? '#18181b' : '#f9fafb',
        headerText: isDark ? '#a1a1aa' : '#6b7280',
        mutedBg: isDark ? '#18181b' : '#f3f4f6',
        mutedText: isDark ? '#a1a1aa' : '#6b7280',
        border: isDark ? '#27272a' : '#e5e7eb',
      });
    };

    // Initial colors
    updateColors();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, [resolvedTheme]);

  return colors;
}
