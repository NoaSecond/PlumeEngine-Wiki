/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary-color) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary-color) / <alpha-value>)',
        },
        custom: {
          bg: 'rgb(var(--bg-color) / <alpha-value>)',
          surface: 'rgb(var(--surface-color) / <alpha-value>)',
          border: 'rgb(var(--border-color) / <alpha-value>)',
          text: 'rgb(var(--text-color) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-color) / <alpha-value>)',
          sidebar: 'rgb(var(--sidebar-color) / <alpha-value>)',
          header: 'rgb(var(--header-color) / <alpha-value>)',
          accent: 'rgb(var(--accent-color) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
};
