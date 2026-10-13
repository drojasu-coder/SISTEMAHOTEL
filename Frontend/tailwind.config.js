/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bronze: {
          500: '#A9774A',
          700: '#7D5632',
        },
        gold: {
          100: '#E9D8BF',
          300: '#C4966A',
        },
        cream: {
          50: '#FBF8F1',
          100: '#F5F0E3',
        },
        charcoal: {
          200: '#D9DBDD',
          400: '#8A8F94',
          700: '#3A3F44',
          900: '#212224',
        },
        status: {
          success: '#3F7D58',
          'success-bg': '#E6F2EA',
          warning: '#C98A1B',
          'warning-bg': '#FBF1DC',
          danger: '#B3402F',
          'danger-bg': '#F8E4E0',
          info: '#3D6A8A',
          'info-bg': '#E3EEF5',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        field: '8px',
        card: '16px',
        badge: '9999px',
      },
    },
  },
  plugins: [],
};
