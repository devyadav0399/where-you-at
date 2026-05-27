/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:   '#FBF8F3',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#1A1815',
          2: '#6B6862',
          3: '#A09C95',
        },
        coral: {
          DEFAULT: '#FF6B47',
          ink:     '#C9482A',
          bg:      '#FFE8E0',
        },
      },
      borderRadius: {
        card:  '16px',
        input: '10px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(20,16,12,0.04)',
        md: '0 4px 16px rgba(20,16,12,0.06), 0 1px 2px rgba(20,16,12,0.04)',
        lg: '0 12px 40px rgba(20,16,12,0.10), 0 2px 8px rgba(20,16,12,0.04)',
      },
    },
  },
  plugins: [],
};
