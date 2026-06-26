/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark charcoal-teal neutrals
        main: {
          100: '#ccfbf1', // teal-100 — lightest labels
          200: '#99f6e4', // teal-200 — secondary text
          300: '#5eead4', // teal-300 — muted accent
          400: '#1e3333', // dark teal-charcoal — input backgrounds
          500: '#152626', // surfaces
          600: '#0f1e1e', // sidebar panels
          700: '#0a1414', // deep background
          800: '#060d0d', // near-black
          900: '#030808', // deepest
        },
        // Accent palette
        accent: {
          teal:    '#2dd4bf', // teal-400   — primary
          emerald: '#10b981', // emerald-500 — secondary/success
          cyan:    '#22d3ee', // cyan-400   — highlight
          amber:   '#f59e0b', // amber-500  — warning
          rose:    '#f43f5e', // rose-500   — error/recording
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        glow:  '0 0 24px rgba(45,212,191,0.25)',
        card:  '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
