/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fef9ec', 100: '#fdf0c8', 200: '#fbe08d',
          300: '#f9cc52', 400: '#f7b928', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
        },
        surface: {
          0: '#ffffff', 50: '#f8f9fc', 100: '#f1f3f9',
          200: '#e4e8f1', 300: '#d1d7e5', 400: '#9aa5bd',
          500: '#6b7a99', 600: '#4a5568', 700: '#2d3748',
          800: '#1a202c', 900: '#0f1320', 950: '#080d1a',
        },
        gold: '#f59e0b',
        support: '#3b82f6',
        testing: '#8b5cf6',
        project: '#10b981',
      },
    }
  },
  plugins: [],
}
