/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2342B5',
          50: '#E8ECFB',
          100: '#D0D9F7',
          200: '#A1B3EF',
          300: '#728DE7',
          400: '#4367DF',
          500: '#2342B5',
          600: '#1B3491',
          700: '#14276D',
          800: '#0D1A49',
          900: '#07153A',
        },
        navy: {
          50: '#E8EAF0',
          100: '#D1D5E0',
          200: '#A3ABC2',
          300: '#7581A3',
          400: '#475785',
          500: '#1A2D66',
          600: '#142452',
          700: '#0F1B3D',
          800: '#0A1229',
          900: '#07153A',
        },
        accent: {
          DEFAULT: '#FF7A1A',
          50: '#FFF2E8',
          100: '#FFE5D1',
          200: '#FFCBA3',
          300: '#FFB175',
          400: '#FF9747',
          500: '#FF7A1A',
          600: '#E06200',
          700: '#B84E00',
          800: '#903A00',
          900: '#682600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 122, 26, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 122, 26, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
