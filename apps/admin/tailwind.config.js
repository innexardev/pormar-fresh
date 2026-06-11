/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fresh: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          400: '#4ade80',
          500: '#3ecf7a',
          600: '#2eb867',
          700: '#249653',
        },
      },
    },
  },
  plugins: [],
};
