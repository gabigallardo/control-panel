/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary / Base  (#2B3E4C) ─────────────────────────────
        // Deep teal-slate foundation
        panel: {
          50: '#E8EEF2',
          100: '#C8D5DD',
          200: '#A3B7C4',
          300: '#7D99AB',
          400: '#5A7A8E',
          500: '#3E5E70',
          600: '#2B3E4C',   // ← base
          700: '#233343',
          800: '#1B2834',
          900: '#131D25',
          950: '#0C1319',
        },

        // ── Detail / Accent (#F4DFB9) ─────────────────────────────
        // Warm golden sand
        sand: {
          50: '#FEFBF3',
          100: '#FDF6E5',
          200: '#F9EDCF',
          300: '#F4DFB9',   // ← base
          400: '#EED09A',
          500: '#E5BD73',
          600: '#D9A74E',
          700: '#B8882E',
          800: '#8C6722',
          900: '#614819',
          950: '#3D2E10',
        },

        // ── Text (#FCF2DC) ────────────────────────────────────────
        // Warm cream for readability
        cream: {
          50: '#FEFDF9',
          100: '#FCF2DC',   // ← base
          200: '#F8E6BF',
          300: '#F2D69E',
          400: '#EAC37A',
          500: '#DFAD55',
          600: '#C99438',
          700: '#A27728',
          800: '#7B5A1E',
          900: '#553E15',
          950: '#352710',
        },

        // ── Chart / Success (#87B867) ─────────────────────────────
        // Fresh natural green
        leaf: {
          50: '#F1F8EC',
          100: '#DFF0D3',
          200: '#C4E2AB',
          300: '#A3D080',
          400: '#87B867',   // ← base
          500: '#6D9E4E',
          600: '#56803D',
          700: '#41622F',
          800: '#2E4622',
          900: '#1D2D16',
          950: '#111B0D',
        },
      },
    },
  },
  plugins: [],
}