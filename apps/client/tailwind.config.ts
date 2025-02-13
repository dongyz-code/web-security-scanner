import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addVariant, addUtilities }) {
      addUtilities({
        '.scroll-bar': {
          '&::-webkit-scrollbar': {
            width: '0.5rem',
            height: '0.5rem',
          },
          '&::-webkit-scrollbar-thumb': {
            'border-radius': '0.5rem',
            'background-color': "theme('colors.gray.300')",
          },
        },
      });
    }),
  ],
};

export default config;
