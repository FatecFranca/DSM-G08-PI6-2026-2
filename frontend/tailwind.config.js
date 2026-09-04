/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F6',
        pastel: {
          sage: '#E3EBDD',
          'sage-dark': '#4F6355',
          sand: '#F2EFE9',
          cream: '#F9F8F5',
          peach: '#F8ECE8',
          'peach-dark': '#A85A48',
          blue: '#DEE8EE',
          'blue-dark': '#416377',
          lavender: '#EAE6F0',
          'lavender-dark': '#5D5077',
          amber: '#F6EED8',
          'amber-dark': '#8A6D24',
          slate: '#2B303A'
        }
      }
    },
  },
  plugins: [],
}
