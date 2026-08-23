/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./sdg-reports/**/*.html",
    "./research/**/*.html",
    "./impact/**/*.html",
    "./indicators/**/*.html",
    "./events/**/*.html",
    "./evidence/**/*.html",
    "./admin/**/*.html",
    "./admin/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'ucu-blue': '#394a8a',
        'ucu-blue-dark': '#24305e',
        'ucu-yellow': '#fbef4b',
        'ucu-red': '#c43643',
        'ucu-white': '#ffffff',
        'dark-red': '#912020',
        'canvas': '#f4f7fa',
        'muted': '#555555',
        'main2': '#1f1f1f',
        // Org brand colors
        'org-wuri': '#144989',
        'org-appliedhe': '#f62c09',
        'org-uigreenmetric': '#089c44',
        'org-the': '#e50328',
        'org-hehigher': '#013c44',
        // SDG colors
        'sdg-1': '#E5243B',
        'sdg-3': '#4C9F38',
        'sdg-4': '#C5192D',
        'sdg-5': '#FF3A21',
        'sdg-16': '#00689D',
        'sdg-17': '#19486A',
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      }
    },
  },
  plugins: [],
}
