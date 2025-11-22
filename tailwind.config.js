/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'load-red': '#FF5A5F',
        'load-orange': '#FF8C42',
        'load-yellow': '#FFD93D',
      },
    },
  },
  plugins: [],
}

