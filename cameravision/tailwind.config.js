/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate-based neutrals — replaces old flat navy blues
        main: {
          100: '#f1f5f9', // slate-100  — lightest text / labels
          200: '#cbd5e1', // slate-300  — secondary text
          300: '#94a3b8', // slate-400  — muted text
          400: '#475569', // slate-600  — input backgrounds
          500: '#334155', // slate-700  — cards / surfaces
          600: '#1e293b', // slate-800  — sidebar / panels
          700: '#0f172a', // slate-900  — deep background
          800: '#080f1e', // near-black
          900: '#040810', // deepest
        },
        // Vivid accent palette
        accent: {
          indigo:  '#6366f1', // indigo-500
          violet:  '#8b5cf6', // violet-500
          cyan:    '#22d3ee', // cyan-400
          emerald: '#10b981', // emerald-500
          amber:   '#f59e0b', // amber-500
          rose:    '#f43f5e', // rose-500
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow:   '0 0 20px rgba(99,102,241,0.3)',
        card:   '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
