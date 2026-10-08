/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#0b1a1e', 900: '#0f2328', 800: '#16323a', 700: '#1f434d', 600: '#2c5965' },
        brand: { 50: '#fff4ed', 100: '#ffe6d5', 400: '#fb923c', 500: '#ea580c', 600: '#c2410c', 700: '#9a3412' },
      },
    },
  },
  plugins: [],
};
