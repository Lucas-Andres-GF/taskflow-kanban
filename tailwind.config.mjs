/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom dark mode palette
        dark: {
          bg: '#111827',      // Main background
          card: '#1F2937',    // Card background
          border: '#374151',  // Border color
        },
        mint: {
          DEFAULT: '#10B981',  // Mint accent
          light: '#34D399',     // Lighter mint
          dark: '#059669',      // Darker mint
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}