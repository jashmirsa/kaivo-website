import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kaivo: {
          black: '#05030D',
          white: '#FFFFFF',
          ivory: '#F6F4F2',
          purple: '#9B5CFF',
          indigo: '#6773FF',
        },
      },
      fontFamily: {
        heading: ["'General Sans'", 'sans-serif'],
        body: ["'Geist Sans'", 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
