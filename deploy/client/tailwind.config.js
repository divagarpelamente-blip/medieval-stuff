/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medieval: {
          gold: '#d97706',
          goldLight: '#fbbf24',
          wood: '#451a03',
          woodDark: '#2d0f02',
          slate: '#334155',
          parchment: '#f5f5f4',
        },
        stone: {
          950: '#0c0a09',
          900: '#1c1917',
          800: '#292524',
        },
        violet: {
          600: '#7c3aed',
          700: '#6d28d9',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        medieval: ['"Cinzel"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'medieval-pattern': "url('https://www.transparenttextures.com/patterns/dark-leather.png')",
      }
    },
  },
  plugins: [],
}
