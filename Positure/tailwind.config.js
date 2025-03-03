/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          brown: {
            100: '#f5f0e6',
            500: '#a97c50',
            800: '#5a3e2b'
          }
        }
      }
    },
    plugins: []
  };
  