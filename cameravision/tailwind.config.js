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
          900: '#0c1e35',
        },
        accent: {
          blue:   '#3b82f6',
          green:  '#22c55e',
          yellow: '#f59e0b',
          red:    '#ef4444',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.37)',
        card:  '0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
