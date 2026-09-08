/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030303', // Extremely deep black
        surface: '#0f0f11', // Slightly lighter for cards
        'surface-hover': '#1a1a1c',
        primary: '#E77B26', // Logo Orange
        secondary: '#333333',
        text: '#F6ECD1', // Logo Cream
        'text-muted': '#94a3b8',
        border: '#27272a',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
