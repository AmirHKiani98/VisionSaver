/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Light-theme neutrals (low number = dark text, high number = light surfaces)
        main: {
          100: '#0f172a', // slate-950  — primary text
          200: '#64748b', // slate-500  — secondary / muted text
          300: '#94a3b8', // slate-400  — placeholder / disabled
          400: '#f1f5f9', // slate-100  — input / field backgrounds
          500: '#14b8a6', // teal-500   — accent buttons
          600: '#0f766e', // teal-700   — accent active / hover
          700: '#f8fafc', // slate-50   — light surfaces
          800: '#e2e8f0', // slate-200  — borders / dividers
          900: '#f0fdfa', // teal-50    — chip / badge tint
        },
        accent: {
          teal:    '#14b8a6', // teal-500
          emerald: '#059669', // emerald-600
          cyan:    '#06b6d4', // cyan-500
          amber:   '#d97706', // amber-600
          rose:    '#e11d48', // rose-600
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)',
        panel: '0 2px 8px rgba(0,0,0,0.09)',
      },
    },
  },
  plugins: [],
}
