/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./node_modules/@material-tailwind/html/**/*.{js,jsx,ts,tsx}"
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
});
