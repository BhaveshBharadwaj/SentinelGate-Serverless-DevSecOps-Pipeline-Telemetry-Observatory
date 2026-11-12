/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0b0a09',
        charcoal: '#141210',
        panel: '#1c1917',
        borderWarm: '#292524',
        gold: {
          DEFAULT: '#d4a359',
          light: '#e6be8a',
          dark: '#9c7336',
          muted: 'rgba(212, 163, 89, 0.14)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
