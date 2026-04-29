/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F6F3',
          soft: '#FBFBFA',
          card: '#FFFFFF',
          muted: '#F9F9F8',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#3F3D39',
          muted: '#76736D',
          faint: '#A8A39B',
        },
        line: '#EAEAEA',
        pastel: {
          red: '#FDEBEC',
          redText: '#9F2F2D',
          blue: '#E1F3FE',
          blueText: '#245A78',
          green: '#EDF3EC',
          greenText: '#3E6544',
          yellow: '#FBF3DB',
          yellowText: '#7A5B1E',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Geist Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Newsreader', 'Lyon Text', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
