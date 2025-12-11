import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ameritech Brand Colors
        primary: {
          50: '#f0f6fd',
          100: '#e0edfa',
          200: '#bddcf5',
          300: '#9acbf0',
          400: '#5fa5e8',
          500: '#0055B8', // Primary Medium Blue
          600: '#0047a3',
          700: '#003D82', // Primary Corporate Blue
          800: '#003070',
          900: '#002555',
        },
        accent: {
          light: '#1E90FF', // Primary Light Blue
          DEFAULT: '#B31B1B', // Accent Red
          dark: '#8B1515',
        },
        neutral: {
          text: '#1F2937', // Text Dark Gray
          bg: '#F3F4F6', // Background Light Gray
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
