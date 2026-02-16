/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FFF9E6',
          100: '#FFEFCC',
          200: '#FFDF99',
          300: '#FFCF66',
          400: '#FFBF33',
          500: '#FFAF00',
          600: '#CC8C00',
          700: '#996900',
          800: '#664600',
          900: '#332300',
        }
      }
    },
  },
  plugins: [],
}

