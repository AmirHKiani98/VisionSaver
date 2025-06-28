/** @type {import('tailwindcss').Config} */

module.exports =  {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        main: {
          100: '#e6ecf3',
          200: '#b8c9df',
          300: '#8aa6cb',
          400: '#5c83b7',
          500: '#2e60a3',
          600: '#20497e',
          700: '#18375e',
          800: '#122846',
          900: '#113c66',
        },
      },
    },
  },
  plugins: [],
}
