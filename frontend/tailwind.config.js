/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e5edff',
          200: '#cdd9ff',
          300: '#a6bbff',
          400: '#7c96ff',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
        accent: {
          purple: '#a855f7',
          blue: '#3b82f6',
          orange: '#f59e0b',
          pink: '#ec4899',
          green: '#10b981',
        },
        dark: {
          bg: '#0a0e1a',
          card: '#1a1f2e',
          section: '#0f1419',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
