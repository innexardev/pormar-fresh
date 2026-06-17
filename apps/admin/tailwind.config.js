/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        fresh: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efac',
          400: '#4ade80',
          500: '#3ecf7a',
          600: '#2eb867',
          700: '#249653',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgb(46 184 103 / 0.15)',
      },
    },
  },
  plugins: [],
};
