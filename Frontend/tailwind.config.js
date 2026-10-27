/**
 * Tokens adaptados de la guía visual (MATERIAL-HOTEL/guia-componentes, Tailwind 4)
 * a Tailwind 3. Los nombres se conservan en español como en la guía.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bronce: {
          50: '#FBF6EF',
          100: '#F4E9DA',
          200: '#E8D3B6',
          300: '#D9B992',
          400: '#C59B6D',
          500: '#AD7F4F',
          600: '#906438',
          700: '#774F2C',
          800: '#5C3C22',
          900: '#3F2917',
        },
        neutro: {
          50: '#FBF7F0',
          100: '#F4EEE4',
          200: '#E8E0D2',
          300: '#D5CBB9',
          400: '#B0A592',
          500: '#857B6A',
          600: '#645B4D',
          700: '#4A4239',
          800: '#3A332C',
          900: '#2B2622',
        },
        selva: {
          50: '#F1F5F0',
          100: '#DFE8DC',
          200: '#BFD0BA',
          300: '#96B08F',
          400: '#6B8F64',
          500: '#4C7347',
          600: '#3B5C38',
          700: '#2F4A2E',
          800: '#243A24',
          900: '#182818',
        },
        exito: { 50: '#EEF7EF', 600: '#2E7D32', 700: '#1F5F23' },
        error: { 50: '#FDF0EE', 600: '#B42318', 700: '#8F1B12' },
        advertencia: { 50: '#FFF7E6', 600: '#B06E00', 700: '#7A4A00' },
        info: { 50: '#EEF4FA', 600: '#1F5F9E', 700: '#174A7C' },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(43, 38, 34, 0.04)',
      },
      spacing: {
        sidebar: '248px',
      },
      minHeight: {
        11: '2.75rem',
        13: '3.25rem',
      },
    },
  },
  plugins: [],
};
